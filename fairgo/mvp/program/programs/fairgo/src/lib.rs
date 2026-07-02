use anchor_lang::prelude::*;

// Placeholder program id — replace with the real deploy key.
// After `anchor build`, run `anchor keys list` and then `anchor keys sync`
// to write the generated key back into this file and Anchor.toml.
declare_id!("Fairgo1111111111111111111111111111111111");

/// Fixed-point scale for FGV and confidence-interval values.
/// A stored value of SCALE (1_000_000) represents 1.0.
/// Rationale: avoids f64 cross-client rounding drift, which would make
/// independent recomputation/verification of a published score ambiguous.
pub const SCALE: u32 = 1_000_000;

#[program]
pub mod fairgo {
    use super::*;

    /// One-time setup. Creates the singleton Config PDA and records the
    /// single trusted authority permitted to publish attestations.
    /// Whoever calls this becomes the authority — call it once, from the
    /// operator's own wallet, immediately after deploy.
    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Publishes (or overwrites) the FairGo attestation for a given wallet.
    /// Only the configured authority may call this. Because the attestation
    /// PDA is derived solely from the wallet address, a second call for the
    /// same wallet overwrites the previous attestation in place — this is
    /// the intended "latest score wins" MVP semantics, not a bug.
    ///
    /// All computation (A/T/O/D -> FGV, confidence interval) happens off-chain.
    /// This instruction only validates and stores the result.
    pub fn publish_attestation(
        ctx: Context<PublishAttestation>,
        wallet: Pubkey,
        fgv: u32,
        ci_lower: u32,
        ci_upper: u32,
        audit_window_start: i64,
        audit_window_end: i64,
        evidence_hash: [u8; 32],
        schema_version: u8,
    ) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.config.authority,
            FairGoError::UnauthorizedAuthority
        );
        require!(fgv <= SCALE, FairGoError::ValueOutOfRange);
        require!(ci_upper <= SCALE, FairGoError::ValueOutOfRange);
        require!(ci_lower <= ci_upper, FairGoError::InvalidConfidenceInterval);
        require!(
            audit_window_start <= audit_window_end,
            FairGoError::InvalidAuditWindow
        );

        let attestation = &mut ctx.accounts.attestation;
        attestation.wallet = wallet;
        attestation.fgv = fgv;
        attestation.ci_lower = ci_lower;
        attestation.ci_upper = ci_upper;
        attestation.audit_window_start = audit_window_start;
        attestation.audit_window_end = audit_window_end;
        attestation.evidence_hash = evidence_hash;
        attestation.auditor = ctx.accounts.authority.key();
        attestation.created_at = Clock::get()?.unix_timestamp;
        attestation.schema_version = schema_version;
        attestation.bump = ctx.bumps.attestation;
        Ok(())
    }
}

// ---------------------------------------------------------------------
// Accounts (instruction contexts)
// ---------------------------------------------------------------------

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = Config::SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct PublishAttestation<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    // init_if_needed: first publish for a wallet creates the PDA, every
    // subsequent publish for the same wallet just rewrites its fields.
    // Safe here specifically because writes are gated to a single, fixed
    // authority (checked above) — there is no re-initialization race to
    // exploit since nobody else can ever call this successfully.
    #[account(
        init_if_needed,
        payer = authority,
        space = Attestation::SPACE,
        seeds = [b"attestation", wallet.as_ref()],
        bump
    )]
    pub attestation: Account<'info, Attestation>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub bump: u8,
}

impl Config {
    // discriminator(8) + authority(32) + bump(1)
    pub const SPACE: usize = 8 + 32 + 1;
}

#[account]
pub struct Attestation {
    pub wallet: Pubkey,             // the actor this attestation is about
    pub fgv: u32,                   // fixed-point, SCALE = 1.0
    pub ci_lower: u32,              // fixed-point
    pub ci_upper: u32,              // fixed-point
    pub audit_window_start: i64,    // unix timestamp
    pub audit_window_end: i64,      // unix timestamp
    pub evidence_hash: [u8; 32],    // SHA-256 of the raw behaviour JSON
    pub auditor: Pubkey,            // signer who published (== config.authority for MVP)
    pub created_at: i64,            // unix timestamp of this publish
    pub schema_version: u8,         // versions the A/T/O/D -> FGV formula
    pub bump: u8,
}

impl Attestation {
    // discriminator(8) + wallet(32) + fgv(4) + ci_lower(4) + ci_upper(4)
    // + audit_window_start(8) + audit_window_end(8) + evidence_hash(32)
    // + auditor(32) + created_at(8) + schema_version(1) + bump(1)
    pub const SPACE: usize = 8 + 32 + 4 + 4 + 4 + 8 + 8 + 32 + 32 + 8 + 1 + 1;
}

// ---------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------

#[error_code]
pub enum FairGoError {
    #[msg("Only the configured authority may publish attestations.")]
    UnauthorizedAuthority,
    #[msg("FGV or confidence interval value exceeds the fixed-point scale (1,000,000 = 1.0).")]
    ValueOutOfRange,
    #[msg("ci_lower must be <= ci_upper.")]
    InvalidConfidenceInterval,
    #[msg("audit_window_start must be <= audit_window_end.")]
    InvalidAuditWindow,
}
