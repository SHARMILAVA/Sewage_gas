# PowerShell HTTP Server for Sewage Gas Dashboard
$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host @"
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🌐 SEWAGE GAS SAFETY DASHBOARD - SERVER RUNNING       ║
║                                                            ║
║     📱 Open your browser and go to:                        ║
║     👉 http://localhost:$port                              ║
║                                                            ║
║     ✅ Server is listening on port $port                   ║
║     Press Ctrl+C to stop the server                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"@

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $url = $request.Url.LocalPath
        if ($url -eq "/" -or $url -eq "") {
            $url = "/login.html"
        }

        $filePath = Join-Path (Get-Location) $url

        if (Test-Path $filePath -PathType Leaf) {
            $fileContent = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $fileContent.Length

            # Set content type
            $extension = [System.IO.Path]::GetExtension($filePath)
            switch ($extension) {
                ".html" { $response.ContentType = "text/html"; break }
                ".js" { $response.ContentType = "application/javascript"; break }
                ".css" { $response.ContentType = "text/css"; break }
                ".json" { $response.ContentType = "application/json"; break }
                ".png" { $response.ContentType = "image/png"; break }
                ".jpg" { $response.ContentType = "image/jpeg"; break }
                ".gif" { $response.ContentType = "image/gif"; break }
                default { $response.ContentType = "application/octet-stream"; break }
            }

            $response.OutputStream.Write($fileContent, 0, $fileContent.Length)
            Write-Host "✅ $($request.HttpMethod) $url - 200 OK"
        } else {
            $response.StatusCode = 404
            $notFoundMessage = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 - File Not Found</h1>")
            $response.OutputStream.Write($notFoundMessage, 0, $notFoundMessage.Length)
            Write-Host "❌ $($request.HttpMethod) $url - 404 Not Found"
        }

        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Error: $_"
} finally {
    $listener.Stop()
    $listener.Close()
}
