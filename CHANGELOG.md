# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Backend:** Created `@momen124/ai-monitor-ai` package skeleton and core AI interfaces (`AIIncidentContext`, `AIEnrichmentResult`, `AIProvider`) in `@momen124/ai-monitor-core` to establish the baseline contract for Epic 6 (#31).

## [2.0.0-alpha.1] - 2026-04-01

### Changed

- **Architecture Pivot**: Transitioned from an in-process Node.js telemetry SDK to a standalone AI SRE service model.
- **Delegation**: Telemetry collection is now officially delegated to OpenTelemetry (`@opentelemetry/auto-instrumentations-node`).
- **Delegation**: Storage and APM are now delegated to SigNoz.
- **Delegation**: Alert workflow, maintenance windows, and deduplication are now delegated to Keep.
- **Refactoring**: Restructured into three dedicated packages focusing on the AI Moat: `@momen124/ai-monitor-ai`, `@momen124/ai-monitor-otel`, and `@momen124/ai-monitor-core`.
- **Docs**: Completely rewrote the documentation to reflect the new architecture, stack-agnostic approach, and `docker-compose` quickstart.

## [1.1.0] - 2026-02-08

### Added

- **Test suite**: 76 unit tests across all 3 packages (core, notifiers, instrumentation)
- **CI/CD**: GitHub Actions workflows for CI (lint â†’ build â†’ test) and npm publishing
- **Docker**: Multi-stage Dockerfile + docker-compose with Prometheus & Grafana
- **Config**: `.env.example` documenting all environment variables
- **Prometheus**: Scrape config and Grafana datasource auto-provisioning

### Fixed

- `performanceThreshold` type error — field was used in `http-interceptor.ts` and `performance-monitor.ts` but missing from `IInstrumentationConfig`

### Changed

- Root `package.json` now runs Jest from root instead of per-package
- Expanded `.gitignore` to cover `dist/`, `coverage/`, `.env`, `*.log`

## [1.0.0] - 2026-02-05

### Added

- Initial release of `@momen124/ai-monitor-core` — AIMonitor, AIService, ConfigBuilder
- Initial release of `@momen124/ai-monitor-notifiers` — Telegram, Slack, Email, Multi
- Initial release of `@momen124/ai-monitor-instrumentation` — Golden Signals, Prometheus, HTTP/error/performance interceptors
- Standalone service example with Docker Compose
