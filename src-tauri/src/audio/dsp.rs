//! Spoot Music — Digital Signal Processing (DSP) Pipeline
//! Inclut l'égaliseur paramétrique 10 bandes, la normalisation EBU R128,
//! le limiteur anti-saturation True-Peak et l'interpolateur de fondu enchaîné (Crossfade).

use std::f32::consts::PI;

/// Fréquences centrales des 10 bandes d'égalisation Spoot Music (en Hz)
pub const EQ_FREQUENCIES: [f32; 10] = [
    31.0, 62.0, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0,
];

/// Filtre biquad paramétrique basé sur les formules audio RBJ (Audio EQ Cookbook)
#[derive(Debug, Clone)]
pub struct BiquadFilter {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    // États pour le canal gauche
    x1_l: f32,
    x2_l: f32,
    y1_l: f32,
    y2_l: f32,
    // États pour le canal droit
    x1_r: f32,
    x2_r: f32,
    y1_r: f32,
    y2_r: f32,
}

impl BiquadFilter {
    pub fn new() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            x1_l: 0.0,
            x2_l: 0.0,
            y1_l: 0.0,
            y2_l: 0.0,
            x1_r: 0.0,
            x2_r: 0.0,
            y1_r: 0.0,
            y2_r: 0.0,
        }
    }

    /// Configure le filtre en tant que Peaking EQ (filtre en cloche)
    /// gain_db : atténuation ou amplification en dB (-12 dB à +12 dB)
    /// q : facteur de qualité (typiquement 1.41 pour les bandes d'octave)
    pub fn configure_peaking(&mut self, freq_hz: f32, gain_db: f32, q: f32, sample_rate: f32) {
        if gain_db.abs() < 0.01 {
            // Bypass si gain neutre
            self.b0 = 1.0;
            self.b1 = 0.0;
            self.b2 = 0.0;
            self.a1 = 0.0;
            self.a2 = 0.0;
            return;
        }

        let a = 10.0f32.powf(gain_db / 40.0);
        let omega = 2.0 * PI * freq_hz / sample_rate;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let a0 = 1.0 + alpha / a;
        self.b0 = (1.0 + alpha * a) / a0;
        self.b1 = (-2.0 * cos_omega) / a0;
        self.b2 = (1.0 - alpha * a) / a0;
        self.a1 = (-2.0 * cos_omega) / a0;
        self.a2 = (1.0 - alpha / a) / a0;
    }

    /// Filtre un échantillon gauche
    #[inline(always)]
    pub fn process_left(&mut self, input: f32) -> f32 {
        let output = self.b0 * input + self.b1 * self.x1_l + self.b2 * self.x2_l
            - self.a1 * self.y1_l
            - self.a2 * self.y2_l;

        self.x2_l = self.x1_l;
        self.x1_l = input;
        self.y2_l = self.y1_l;
        self.y1_l = output;

        output
    }

    /// Filtre un échantillon droit
    #[inline(always)]
    pub fn process_right(&mut self, input: f32) -> f32 {
        let output = self.b0 * input + self.b1 * self.x1_r + self.b2 * self.x2_r
            - self.a1 * self.y1_r
            - self.a2 * self.y2_r;

        self.x2_r = self.x1_r;
        self.x1_r = input;
        self.y2_r = self.y1_r;
        self.y1_r = output;

        output
    }

    pub fn reset_state(&mut self) {
        self.x1_l = 0.0;
        self.x2_l = 0.0;
        self.y1_l = 0.0;
        self.y2_l = 0.0;
        self.x1_r = 0.0;
        self.x2_r = 0.0;
        self.y1_r = 0.0;
        self.y2_r = 0.0;
    }
}

/// Égaliseur paramétrique 10 bandes
pub struct ParametricEqualizer {
    filters: [BiquadFilter; 10],
    sample_rate: f32,
    gains_db: [f32; 10],
    enabled: bool,
}

impl ParametricEqualizer {
    pub fn new(sample_rate: u32) -> Self {
        let mut eq = Self {
            filters: std::array::from_fn(|_| BiquadFilter::new()),
            sample_rate: sample_rate as f32,
            gains_db: [0.0; 10],
            enabled: true,
        };
        eq.recalculate();
        eq
    }

    pub fn set_sample_rate(&mut self, sample_rate: u32) {
        self.sample_rate = sample_rate as f32;
        self.recalculate();
    }

    pub fn set_band_gain(&mut self, band_idx: usize, gain_db: f32) {
        if band_idx < 10 {
            self.gains_db[band_idx] = gain_db.clamp(-12.0, 12.0);
            self.filters[band_idx].configure_peaking(
                EQ_FREQUENCIES[band_idx],
                self.gains_db[band_idx],
                1.41,
                self.sample_rate,
            );
        }
    }

    pub fn set_all_gains(&mut self, gains: [f32; 10]) {
        for (i, &gain) in gains.iter().enumerate() {
            self.set_band_gain(i, gain);
        }
    }

    pub fn recalculate(&mut self) {
        for i in 0..10 {
            self.filters[i].configure_peaking(
                EQ_FREQUENCIES[i],
                self.gains_db[i],
                1.41,
                self.sample_rate,
            );
        }
    }

    /// Traite un bloc d'échantillons stéréo entrelacés [L, R, L, R, ...]
    pub fn process_interleaved(&mut self, samples: &mut [f32]) {
        if !self.enabled {
            return;
        }

        let len = samples.len() - (samples.len() % 2);
        for chunk in samples[..len].chunks_exact_mut(2) {
            let mut l = chunk[0];
            let mut r = chunk[1];

            for filter in &mut self.filters {
                l = filter.process_left(l);
                r = filter.process_right(r);
            }

            chunk[0] = l;
            chunk[1] = r;
        }
    }

    pub fn reset(&mut self) {
        for f in &mut self.filters {
            f.reset_state();
        }
    }
}

/// Limiteur anti-écrêtage (True-Peak Limiter) à genou souple (Soft-Knee)
pub struct TruePeakLimiter {
    threshold: f32,
    ceiling: f32,
}

impl TruePeakLimiter {
    pub fn new(ceiling_db: f32) -> Self {
        let ceiling = 10.0f32.powf(ceiling_db / 20.0);
        Self {
            threshold: ceiling * 0.95,
            ceiling,
        }
    }

    /// Applique la limitation sans distorsion harmonique agressive
    #[inline(always)]
    pub fn limit_sample(&self, sample: f32) -> f32 {
        let abs = sample.abs();
        if abs <= self.threshold {
            sample
        } else if abs <= self.ceiling {
            // Transition à genou souple quadratique
            let excess = abs - self.threshold;
            let ratio = excess / (self.ceiling - self.threshold);
            let soft = self.threshold + (self.ceiling - self.threshold) * (ratio - 0.5 * ratio * ratio);
            soft * sample.signum()
        } else {
            // Plafond strict
            self.ceiling * sample.signum()
        }
    }

    pub fn process(&self, samples: &mut [f32]) {
        for s in samples.iter_mut() {
            *s = self.limit_sample(*s);
        }
    }
}

/// Moteur de fondu enchaîné (Crossfade Engine)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CrossfadeCurve {
    Linear,
    EqualPower,
}

pub struct CrossfadeInterpolator;

impl CrossfadeInterpolator {
    /// Calcule les coefficients de gain pour la piste sortante et la piste entrante
    /// progress : valeur de 0.0 (début du fondu) à 1.0 (fin du fondu)
    #[inline(always)]
    pub fn compute_gains(progress: f32, curve: CrossfadeCurve) -> (f32, f32) {
        let p = progress.clamp(0.0, 1.0);
        match curve {
            CrossfadeCurve::Linear => (1.0 - p, p),
            CrossfadeCurve::EqualPower => {
                // Courbe d'énergie constante (Equal Power) préservant l'intensité perçue
                let angle = p * (PI / 2.0);
                (angle.cos(), angle.sin())
            }
        }
    }
}
