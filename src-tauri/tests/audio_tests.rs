//! Spoot Music — Core Audio Engine Integration & Unit Tests
//! Valide la latence zéro, la robustesse du tampon circulaire, le limiteur et l'égaliseur.

use spoot_music_core_lib::audio::dsp::{BiquadFilter, ParametricEqualizer, TruePeakLimiter, EQ_FREQUENCIES};
use spoot_music_core_lib::audio::lookahead::LookaheadBufferPool;
use spoot_music_core_lib::audio::ring_buffer::SpscRingBuffer;
use spoot_music_core_lib::audio::types::TrackMetadata;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};

#[test]
fn test_multithreaded_lockfree_ring_buffer_stress() {
    let capacity = 8192;
    let rb = SpscRingBuffer::new(capacity);
    let rb_producer = Arc::clone(&rb);
    let rb_consumer = Arc::clone(&rb);

    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_consumer = Arc::clone(&stop_flag);

    let total_samples_to_produce = 100_000;

    // Thread Producteur (simulant le décodage audio par morceaux)
    let producer = thread::spawn(move || {
        let chunk = vec![0.42f32; 256];
        let mut produced = 0;
        while produced < total_samples_to_produce {
            let written = rb_producer.push_slice(&chunk);
            produced += written;
            if written == 0 {
                thread::yield_now();
            }
        }
        stop_flag.store(true, Ordering::Release);
    });

    // Thread Consommateur (simulant le thread audio temps réel 96 kHz)
    let consumer = thread::spawn(move || {
        let mut read_buffer = vec![0.0f32; 128];
        let mut total_read = 0;
        while !stop_consumer.load(Ordering::Acquire) || rb_consumer.available_read() > 0 {
            let read = rb_consumer.pop_slice(&mut read_buffer);
            total_read += read;
            if read == 0 {
                thread::sleep(Duration::from_micros(50));
            }
        }
        total_read
    });

    producer.join().unwrap();
    let total_consumed = consumer.join().unwrap();

    assert!(total_consumed >= total_samples_to_produce);
    println!("✅ Test Stress Ring-Buffer réussi : {} échantillons traités sans blocage", total_consumed);
}

#[test]
fn test_lookahead_zero_latency_bench() {
    let pool = LookaheadBufferPool::new(96000, 2);

    for i in 1..=3 {
        let track = TrackMetadata {
            id: format!("track_{}", i),
            isrc: format!("FR-SPT-26-0000{}", i),
            title: format!("Lookahead Track {}", i),
            artist: "Spoot Resident".into(),
            album: "Zero Latency EP".into(),
            duration_ms: 240000,
            sample_rate: 96000,
            bit_depth: 24,
            stream_url: None,
            acoustic_profile: None,
        };
        let pcm = LookaheadBufferPool::generate_synthetic_lead_buffer(96000, 2, 440.0 + (i as f32 * 50.0));
        pool.push_prebuffered_track(track, pcm);
    }

    assert_eq!(pool.ready_count(), 3);

    // Mesure de 3 switches consécutifs
    for i in 1..=3 {
        let start = Instant::now();
        let switched = pool.switch_to_next();
        let elapsed = start.elapsed();

        assert!(switched.is_some());
        let (track, buf) = switched.unwrap();
        assert_eq!(track.id, format!("track_{}", i));
        assert_eq!(buf.samples.len(), (5.0 * 96000.0 * 2.0) as usize);

        println!(
            "⚡ Switch Piste {} exécuté en {} nanosecondes (0 ms)",
            i,
            elapsed.as_nanos()
        );
        assert!(elapsed.as_micros() < 100, "Le switch doit s'exécuter en moins de 100 µs");
    }

    assert_eq!(pool.ready_count(), 0);
}

#[test]
fn test_true_peak_limiter_safety() {
    let limiter = TruePeakLimiter::new(-0.2); // Plafond -0.2 dBFS (~0.977f32)
    let max_safe_ceiling = 10.0f32.powf(-0.2 / 20.0);

    // Injection d'un signal ultra saturé (+12 dBFS / amplitude 4.0)
    let mut hot_samples = vec![4.0f32, -4.0f32, 2.5f32, -3.2f32, 1.2f32];
    limiter.process(&mut hot_samples);

    for s in hot_samples {
        assert!(
            s.abs() <= max_safe_ceiling + 1e-4,
            "Échantillon {} dépasse le plafond de sécurité {}",
            s,
            max_safe_ceiling
        );
    }
    println!("✅ Test Limiteur True-Peak validé : signal écrêté avec succès sous le plafond légal");
}

#[test]
fn test_equalizer_peaking_filter() {
    let mut eq = ParametricEqualizer::new(48000);
    // +6 dB sur la bande 1 kHz
    eq.set_band_gain(5, 6.0);

    let mut samples = vec![0.5f32, 0.5f32, 0.5f32, 0.5f32];
    eq.process_interleaved(&mut samples);

    // Vérifie que le signal n'est pas NaN ou infini et reste stable
    for s in samples {
        assert!(!s.is_nan() && !s.is_infinite());
    }
    println!("✅ Test Égaliseur 10 bandes validé : filtres biquad stables");
}
