# CMV Intelligence — Setup Script para Windows
# Execute: .\setup.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  CMV Intelligence — Setup" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# 1. Copiar .env se nao existir
if (-not (Test-Path ".\.env")) {
    Copy-Item ".\.env.example" ".\.env"
    Write-Host "[OK] .env criado a partir de .env.example" -ForegroundColor Green
    Write-Host ""
    Write-Host "[ATENCAO] Edite o arquivo .env e adicione:" -ForegroundColor Yellow
    Write-Host "  - ANTHROPIC_API_KEY=sua_chave_aqui" -ForegroundColor Yellow
    Write-Host "  - JWT_SECRET=uma_string_aleatoria_longa" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Pressione Enter depois de editar o .env (ou Ctrl+C para cancelar)"
} else {
    Write-Host "[OK] .env ja existe" -ForegroundColor Green
}

# 2. Verificar Docker
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "[OK] Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Docker nao encontrado. Instale Docker Desktop primeiro." -ForegroundColor Red
    Write-Host "       https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# 3. Subir containers
Write-Host ""
Write-Host "[...] Subindo containers Docker..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao subir containers" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Containers rodando" -ForegroundColor Green

# 4. Aguardar banco
Write-Host ""
Write-Host "[...] Aguardando banco de dados ficar pronto..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
do {
    Start-Sleep -Seconds 2
    $attempt++
    $healthy = docker-compose exec postgres pg_isready -U cmv_user -d cmv_saas 2>&1
} while ($LASTEXITCODE -ne 0 -and $attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "[ERRO] Banco nao ficou pronto a tempo" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Banco de dados pronto" -ForegroundColor Green

# 5. Migrations
Write-Host ""
Write-Host "[...] Executando migrations..." -ForegroundColor Cyan
docker-compose exec backend npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] Migrations falharam, tentando migrate dev..." -ForegroundColor Yellow
    docker-compose exec backend npx prisma migrate dev --name init
}
Write-Host "[OK] Migrations concluidas" -ForegroundColor Green

# 6. Seed
Write-Host ""
Write-Host "[...] Populando banco com dados demo..." -ForegroundColor Cyan
docker-compose exec backend npm run prisma:seed
Write-Host "[OK] Dados demo inseridos" -ForegroundColor Green

# 7. Resultado
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  CMV Intelligence rodando!" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:3001" -ForegroundColor Cyan
Write-Host "  API:       http://localhost:3001/api/v1" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Login demo:" -ForegroundColor White
Write-Host "  Email:  admin@cmv.com" -ForegroundColor Yellow
Write-Host "  Senha:  Demo@123" -ForegroundColor Yellow
Write-Host ""
