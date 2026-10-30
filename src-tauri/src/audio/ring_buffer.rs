//! Spoot Music — Lock-Free SPSC Ring Buffer
//! File d'attente circulaire haute performance sans verrouillage (Single-Producer Single-Consumer).
//! Conçue pour découpler le thread audio temps réel du thread de décodage/streaming.
//! Évite le "false sharing" mémoire grâce à un alignement sur la ligne de cache CPU (64 octets).

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

/// Ligne de cache CPU standard x86_64 / ARM64 (64 octets)
#[repr(align(64))]
struct CachePadded<T>(T);

/// Tampon circulaire sans verrou pour échantillons audio f32
pub struct SpscRingBuffer {
    buffer: Vec<f32>,
    capacity: usize,
    mask: usize,
    // Pointeur d'écriture (Producer) isolé sur sa ligne de cache
    write_index: CachePadded<AtomicUsize>,
    // Pointeur de lecture (Consumer) isolé sur sa ligne de cache
    read_index: CachePadded<AtomicUsize>,
}

impl SpscRingBuffer {
    /// Initialise le tampon avec une capacité arrondie à la puissance de 2 supérieure
    pub fn new(requested_capacity: usize) -> Arc<Self> {
        let capacity = requested_capacity.next_power_of_two();
        let mask = capacity - 1;

        Arc::new(Self {
            buffer: vec![0.0f32; capacity],
            capacity,
            mask,
            write_index: CachePadded(AtomicUsize::new(0)),
            read_index: CachePadded(AtomicUsize::new(0)),
        })
    }

    /// Écrit un bloc d'échantillons dans le tampon (Thread Producteur)
    /// Retourne le nombre d'échantillons effectivement écrits
    pub fn push_slice(&self, input: &[f32]) -> usize {
        let write = self.write_index.0.load(Ordering::Relaxed);
        let read = self.read_index.0.load(Ordering::Acquire);

        let available = self.capacity - (write.wrapping_sub(read));
        let to_write = input.len().min(available);

        if to_write == 0 {
            return 0;
        }

        // Écriture non verrouillée dans les cellules libres
        for (i, &sample) in input.iter().take(to_write).enumerate() {
            let idx = (write + i) & self.mask;
            // Sécurité : uniquement le producteur écrit sur cette case
            unsafe {
                let cell_ptr = self.buffer.as_ptr().add(idx) as *mut f32;
                *cell_ptr = sample;
            }
        }

        // Publie le nouvel index d'écriture avec sémantique Release
        self.write_index.0.store(write.wrapping_add(to_write), Ordering::Release);
        to_write
    }

    /// Lit un bloc d'échantillons depuis le tampon (Thread Consommateur / Audio Core)
    /// Rempli le reste avec 0.0f32 si le tampon n'a pas assez de données (protection sous-alimentation)
    pub fn pop_slice(&self, output: &mut [f32]) -> usize {
        let read = self.read_index.0.load(Ordering::Relaxed);
        let write = self.write_index.0.load(Ordering::Acquire);

        let available = write.wrapping_sub(read);
        let to_read = output.len().min(available);

        for (i, out_sample) in output.iter_mut().take(to_read).enumerate() {
            let idx = (read + i) & self.mask;
            unsafe {
                let cell_ptr = self.buffer.as_ptr().add(idx);
                *out_sample = *cell_ptr;
            }
        }

        // Si sous-alimentation, comble le reste du buffer de sortie avec du silence
        if to_read < output.len() {
            output[to_read..].fill(0.0f32);
        }

        // Met à jour l'index de lecture avec sémantique Release
        self.read_index.0.store(read.wrapping_add(to_read), Ordering::Release);
        to_read
    }

    /// Retourne le nombre d'échantillons actuellement disponibles pour la lecture
    pub fn available_read(&self) -> usize {
        let write = self.write_index.0.load(Ordering::Acquire);
        let read = self.read_index.0.load(Ordering::Relaxed);
        write.wrapping_sub(read)
    }

    /// Retourne le ratio de remplissage du tampon (0.0 = vide, 1.0 = plein)
    pub fn fill_ratio(&self) -> f32 {
        let available = self.available_read();
        (available as f32) / (self.capacity as f32)
    }

    /// Réinitialise les index du tampon (flush instantané)
    pub fn clear(&self) {
        let current_write = self.write_index.0.load(Ordering::Acquire);
        self.read_index.0.store(current_write, Ordering::Release);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ring_buffer_push_pop_basic() {
        let rb = SpscRingBuffer::new(1024);
        let input = vec![0.5f32, -0.5f32, 1.0f32, -1.0f32];
        let written = rb.push_slice(&input);
        assert_eq!(written, 4);
        assert_eq!(rb.available_read(), 4);

        let mut output = vec![0.0f32; 4];
        let read = rb.pop_slice(&mut output);
        assert_eq!(read, 4);
        assert_eq!(output, input);
        assert_eq!(rb.available_read(), 0);
    }

    #[test]
    fn test_ring_buffer_underrun_silence_padding() {
        let rb = SpscRingBuffer::new(1024);
        let input = vec![0.7f32, -0.7f32];
        rb.push_slice(&input);

        let mut output = vec![99.0f32; 4];
        let read = rb.pop_slice(&mut output);
        assert_eq!(read, 2);
        assert_eq!(output[0], 0.7f32);
        assert_eq!(output[1], -0.7f32);
        assert_eq!(output[2], 0.0f32); // Rempli de silence
        assert_eq!(output[3], 0.0f32);
    }
}
