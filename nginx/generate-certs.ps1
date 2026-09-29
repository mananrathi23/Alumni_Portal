# generate-certs.ps1 — Generates self-signed SSL certificates for LOCAL development.
# In production, replace these with real certificates from Let's Encrypt or your CA.
#
# Prerequisites: OpenSSL installed (comes with Git for Windows).
# Run from the project root: .\nginx\generate-certs.ps1

$certsDir = "$PSScriptRoot\certs"

# Create certs directory if it doesn't exist
if (-not (Test-Path $certsDir)) {
    New-Item -ItemType Directory -Path $certsDir | Out-Null
    Write-Host "[+] Created directory: $certsDir"
}

Write-Host "[*] Generating self-signed SSL certificate for local development..."

# Generate a private key and a self-signed certificate (valid for 365 days)
$opensslArgs = @(
    "req", "-x509", "-nodes",
    "-days", "365",
    "-newkey", "rsa:2048",
    "-keyout", "$certsDir\server.key",
    "-out",    "$certsDir\server.crt",
    "-subj",   "/C=IN/ST=Maharashtra/L=Pune/O=AlumniPortal/CN=localhost"
)

& openssl @opensslArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[+] Success! SSL certificate generated:" -ForegroundColor Green
    Write-Host "    Key : $certsDir\server.key"
    Write-Host "    Cert: $certsDir\server.crt"
    Write-Host ""
    Write-Host "[!] These are SELF-SIGNED certificates for local development only." -ForegroundColor Yellow
    Write-Host "    In production, replace them with certificates from Let's Encrypt." -ForegroundColor Yellow
} else {
    Write-Host "[-] Error: OpenSSL failed. Make sure OpenSSL is installed and in your PATH." -ForegroundColor Red
    Write-Host "    Install Git for Windows (includes OpenSSL): https://git-scm.com/download/win"
    exit 1
}
