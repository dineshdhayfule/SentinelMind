# Deploy script for SentinelMind (PowerShell)
# Run from repository root: .\scripts\deploy.ps1

$ErrorActionPreference = 'Stop'

Write-Host "Deploying SentinelMind via docker compose..." -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker CLI not found. Install Docker Desktop and ensure 'docker' is on PATH." -ForegroundColor Red
    exit 1
}

Push-Location $PSScriptRoot\..\

try {
    Write-Host "Building images..." -ForegroundColor Yellow
    docker compose build --pull

    Write-Host "Starting services..." -ForegroundColor Yellow
    docker compose up -d --remove-orphans

    Write-Host "Showing service status..." -ForegroundColor Green
    docker compose ps

    Write-Host "Deployment finished." -ForegroundColor Green
} catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
