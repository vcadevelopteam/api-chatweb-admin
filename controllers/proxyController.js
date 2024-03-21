exports.sendRequest = async (req, res) => {
    const data = JSON.stringify({
        CompanyDB: "SBODEMOUS",
        Password: "1234",
        UserName: "manager",
    });

    const options = {
        hostname: "190.12.86.123",
        port: 50000,
        path: "/b1s/v1/Login",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: "ROUTEID=.node3",
            "Content-Length": data.length,
        },
        rejectUnauthorized: false, // Ignorar errores de certificado SSL
        // Forzar el uso de TLS 1.0; solo para diagnóstico o entornos controlados
        secureProtocol: "TLSv1_method",
    };

    try {
        const request = https.request(options, (response) => {
            let responseBody = "";

            response.on("data", (chunk) => {
                responseBody += chunk;
            });

            response.on("end", () => {
                // Aquí puedes procesar la respuesta recibida
                console.log(responseBody);
                // Responder al cliente HTTP original con el resultado
                res.status(response.statusCode).json(JSON.parse(responseBody));
            });
        });

        request.on("error", (error) => {
            console.error(error);
            res.status(500).json({ error });
        });

        request.write(data);
        request.end();
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
};