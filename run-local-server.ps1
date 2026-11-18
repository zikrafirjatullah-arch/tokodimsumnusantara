$port = 3000
$url = "http://localhost:$port/"
$htmlPath = Join-Path $PSScriptRoot "preview-lokal.html"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Server Lokal UMKM Dimsum berjalan di: $url" -ForegroundColor Yellow
Write-Host " Tekan Ctrl+C untuk menghentikan server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        $content = [System.IO.File]::ReadAllBytes($htmlPath)
        $response.ContentType = "text/html; charset=utf-8"
        $response.ContentLength64 = $content.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($content, 0, $content.Length)
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
