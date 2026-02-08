# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-08

### Added

- **Test suite**: 76 unit tests across all 3 packages (core, notifiers, instrumentation)
- **CI/CD**: GitHub Actions workflows for CI (lint → build → test) and npm publishing
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

- Initial release of `@aker/ai-monitor-core` — AIMonitor, AIService, ConfigBuilder
- Initial release of `@aker/ai-monitor-notifiers` — Telegram, Slack, Email, Multi
- Initial release of `@aker/ai-monitor-instrumentation` — Golden Signals, Prometheus, HTTP/error/performance interceptors
- Standalone service example with Docker Compose
