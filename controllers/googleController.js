const axios = require("axios");
const jwt = require("jsonwebtoken");

const FormData = require("form-data");

const googleClientId = process.env.GOOGLE_CLIENTID;
const googleClientSecret = process.env.GOOGLE_CLIENTSECRET;
const googleGrantType = process.env.GOOGLE_GRANTYPE;
const googleAuthUri = process.env.GOOGLE_AUTHURI;
const googleRedirectUri = process.env.GOOGLE_REDIRECTURI;

exports.exchangeJwt = async (request, response) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (request.body) {
            const { privateKey, keyId, issuerId } = request.body;

            let datestart = Math.round(new Date().getTime() / 1000);
            let dateend = datestart + 1079;

            let payload = {
                "aud": "appstoreconnect-v1",
                "exp": dateend,
                "iat": datestart,
                "iss": issuerId,
            }

            let header = {
                "algorithm": "ES256",
                header: {
                    "alg": "ES256",
                    "kid": keyId,
                    "typ": "JWT",
                }
            };

            let token = jwt.sign(payload, privateKey, header);

            if (token) {
                requestCode = null;
                requestData = { token: token };
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
};

exports.exchangeCode = async (request, response) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (request.body) {
            const { googlecode } = request.body;

            const data = {};

            data["client_id"] = googleClientId;
            data["client_secret"] = googleClientSecret;
            data["code"] = googlecode;
            data["grant_type"] = googleGrantType;
            data["redirect_uri"] = googleRedirectUri;

            const form = new FormData();

            Object.keys(data).forEach((parameter) => {
                if (![undefined, null].includes(data[parameter])) {
                    form.append(parameter, data[parameter]);
                }
            });

            const tokenResponse = await axios({
                method: "post",
                url: googleAuthUri,
                data: form,
                headers: Object.assign({}, form.getHeaders()),
            });

            if (tokenResponse.data && tokenResponse.status === 200) {
                requestCode = null;
                requestData = tokenResponse.data;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
};

exports.listBlogger = async (request, response) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (request.body) {
            const { accesstoken } = request.body;

            const tokenResponse = await axios({
                method: "get",
                url: "https://www.googleapis.com/blogger/v3/users/self/blogs",
                headers: {
                    Authorization: `Bearer ${accesstoken}`,
                },
            });

            if (tokenResponse.data && tokenResponse.status === 200) {
                requestCode = null;
                requestData = tokenResponse.data;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
};

exports.listYouTube = async (request, response) => {
    try {
        var requestCode = "error_unexpected_error";
        var requestData = null;
        var requestMessage = "error_unexpected_error";
        var requestStatus = 400;
        var requestSuccess = false;

        if (request.body) {
            const { accesstoken } = request.body;

            const tokenResponse = await axios({
                method: "get",
                url: "https://www.googleapis.com/youtube/v3/channels?mine=true&maxResults=50",
                headers: {
                    Authorization: `Bearer ${accesstoken}`,
                },
            });

            if (tokenResponse.data && tokenResponse.status === 200) {
                requestCode = null;
                requestData = tokenResponse.data;
                requestMessage = null;
                requestStatus = 200;
                requestSuccess = true;
            }
        }

        return response.status(requestStatus).json({
            code: requestCode,
            data: requestData,
            error: !requestSuccess,
            message: requestMessage,
            success: requestSuccess,
        });
    } catch (exception) {
        return response.status(500).json({
            code: "error_unexpected_error",
            error: true,
            message: exception.message,
            success: false,
        });
    }
};