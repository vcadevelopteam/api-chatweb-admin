const triggerfunctions = require("../config/triggerfunctions");

exports.generateResponseData = (requestId) => {
    return {
        code: null,
        data: null,
        error: true,
        id: requestId,
        message: "error_unexpected_error",
        status: 400,
        success: false,
    };
}

exports.changeResponseData = (responseData, code, data, message, status = 400, success = false) => {
    responseData.code = code;
    responseData.data = data;
    responseData.error = !success;
    responseData.message = message;
    responseData.status = status;
    responseData.success = success;

    return responseData;
}

exports.getAppSettingLocation = async (location, requestId) => {
    const queryAppSettingGet = await triggerfunctions.executesimpletransaction("UFN_APPSETTING_INVOICE_SEL_LOCATION", {
        location: location,
        _requestid: requestId,
    });

    if (queryAppSettingGet instanceof Array) {
        if (queryAppSettingGet.length > 0) {
            return queryAppSettingGet[0];
        }
    }

    return null;
};

exports.validateEmail = (email) => {
    return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.exec(
        String(email).toLowerCase()
    );
};

exports.convertToUtc = (date) => {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

exports.createLaraigoAccount = async (
    loginusername,
    loginfacebookid,
    logingoogleid,
    loginpassword,
    contactdocumenttype,
    contactdocumentnumber,
    contactfirstname,
    contactlastname,
    contactmail,
    contactphone,
    contactcountry,
    contactcurrency,
    companytype,
    companybusinessname,
    companytradename,
    companyaddress,
    companyfiscalidentifier,
    billingpaymentplanid,
    billingsendinvoice,
    billingpaymentmethod,
    billingautomaticpayment,
    billingautomaticperiod,
    billingautomaticinvoice,
    billingappsettingid,
    billingcityid,
    timezonename,
    timezoneoffset,
    requestId
) => {
    const queryResult = await triggerfunctions.executesimpletransaction("UFN_LARAIGOSUBSCRIPTION_INS", {
        loginusername: loginusername,
        loginfacebookid: loginfacebookid,
        logingoogleid: logingoogleid,
        loginpassword: loginpassword,
        contactdocumenttype: contactdocumenttype,
        contactdocumentnumber: contactdocumentnumber,
        contactfirstname: contactfirstname,
        contactlastname: contactlastname,
        contactmail: contactmail,
        contactphone: contactphone,
        contactcountry: contactcountry,
        contactcurrency: contactcurrency,
        companytype: companytype,
        companybusinessname: companybusinessname,
        companytradename: companytradename,
        companyaddress: companyaddress,
        companyfiscalidentifier: companyfiscalidentifier,
        billingpaymentplanid: billingpaymentplanid,
        billingsendinvoice: billingsendinvoice,
        billingpaymentmethod: billingpaymentmethod,
        billingautomaticpayment: billingautomaticpayment,
        billingautomaticperiod: billingautomaticperiod,
        billingautomaticinvoice: billingautomaticinvoice,
        billingappsettingid: billingappsettingid,
        billingcityid: billingcityid,
        timezonename: timezonename,
        timezoneoffset: timezoneoffset,
        _requestid: requestId,
    });

    if (queryResult instanceof Array) {
        return queryResult[0];
    }

    return null;
};

exports.removeSpecialCharacter = (text) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

exports.getCulqiError = (culqiResponse) => {
    var culqiMessage;

    try {
        if (culqiResponse) {
            let culqiError = JSON.parse(culqiResponse);

            if (culqiError) {
                if (culqiError.user_message) {
                    culqiMessage = culqiError.user_message;
                }

                if (culqiError.merchant_message) {
                    culqiMessage = culqiError.merchant_message.split("https://www.culqi.com/api")[0];
                }
            }
        }
    }
    catch {
        culqiMessage = null;
    }

    return culqiMessage;
}

exports.getExchangeRate = async (code, requestId) => {
    const queryString = "UFN_APPSETTING_INVOICE_SEL_EXCHANGERATE";
    const queryParameters = {
        code: code,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.createInvoice = async (corpId, orgId, invoiceId, description, status, type, issuerRuc, issuerBusinessName, issuerTradeName, issuerFiscalAddress, issuerUbigeo, emitterType, annexCode, printingFormat, xmlVersion, ublVersion, receiverDocType, receiverDocNum, receiverBusinessName, receiverFiscalAddress, receiverCountry, receiverMail, invoiceType, sunatOpeCode, serie, correlative, concept, invoiceDate, expirationDate, subtotal, taxes, totalAmount, currency, exchangeRate, invoiceStatus, fileNumber, purchaseOrder, executingUnitCode, selectionProcessNumber, contractNumber, comments, creditType, creditNoteType, creditNoteMotive, creditNoteDiscount, invoiceReferenceFile, invoicePaymentNote, username, referenceInvoiceId, netAmount, paymentStatus, hasReport, year, month, paymentMethod, requestId) => {
    const queryString = "UFN_INVOICE_INS";
    const queryParameters = {
        annexcode: annexCode,
        comments: comments,
        concept: concept,
        contractnumber: contractNumber,
        corpid: corpId,
        correlative: correlative,
        creditnotediscount: creditNoteDiscount,
        creditnotemotive: creditNoteMotive,
        creditnotetype: creditNoteType,
        credittype: creditType,
        currency: currency,
        description: description,
        emittertype: emitterType,
        exchangerate: exchangeRate,
        executingunitcode: executingUnitCode,
        expirationdate: expirationDate,
        filenumber: fileNumber,
        hasreport: hasReport,
        invoicedate: invoiceDate,
        invoiceid: invoiceId,
        invoicepaymentnote: invoicePaymentNote,
        invoicereferencefile: invoiceReferenceFile,
        invoicestatus: invoiceStatus,
        invoicetype: invoiceType,
        issuerbusinessname: issuerBusinessName,
        issuerfiscaladdress: issuerFiscalAddress,
        issuerruc: issuerRuc,
        issuertradename: issuerTradeName,
        issuerubigeo: issuerUbigeo,
        month: month,
        netamount: netAmount,
        orgid: orgId,
        paymentmethod: paymentMethod,
        paymentstatus: paymentStatus,
        printingformat: printingFormat,
        purchaseorder: purchaseOrder,
        receiverbusinessname: receiverBusinessName,
        receivercountry: receiverCountry,
        receiverdocnum: receiverDocNum,
        receiverdoctype: receiverDocType,
        receiverfiscaladdress: receiverFiscalAddress,
        receivermail: receiverMail,
        referenceinvoiceid: referenceInvoiceId,
        selectionprocessnumber: selectionProcessNumber,
        serie: serie,
        status: status,
        subtotal: subtotal,
        sunatopecode: sunatOpeCode,
        taxes: taxes,
        totalamount: totalAmount,
        type: type,
        ublversion: ublVersion,
        username: username,
        xmlversion: xmlVersion,
        year: year,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.createInvoiceDetail = async (corpId, orgId, invoiceId, description, status, type, quantity, productCode, hasIgv, saleType, igvTribute, measureUnit, totalIgv, totalAmount, igvRate, productPrice, productDescription, productNetPrice, productNetWorth, netAmount, username, requestId) => {
    const queryString = "UFN_INVOICEDETAIL_INS";
    const queryParameters = {
        corpid: corpId,
        description: description,
        hasigv: hasIgv,
        igvrate: igvRate,
        igvtribute: igvTribute,
        invoiceid: invoiceId,
        measureunit: measureUnit,
        netamount: netAmount,
        orgid: orgId,
        productcode: productCode,
        productdescription: productDescription,
        productnetprice: productNetPrice,
        productnetworth: productNetWorth,
        productprice: productPrice,
        quantity: quantity,
        saletype: saleType,
        status: status,
        totalamount: totalAmount,
        totaligv: totalIgv,
        type: type,
        username: username,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

exports.insertCharge = async (corpId, orgId, invoiceId, id, amount, capture, chargeJson, chargeToken, currency, description, email, operation, orderId, orderJson, paidBy, status, tokenId, tokenJson, type, requestId) => {
    const queryString = "UFN_CHARGE_INS";
    const queryParameters = {
        amount: amount,
        capture: capture,
        chargejson: chargeJson,
        chargetoken: chargeToken,
        corpid: corpId,
        currency: currency,
        description: description,
        email: email,
        id: id,
        invoiceid: invoiceId,
        operation: operation,
        orderid: orderId,
        orderjson: orderJson,
        orgid: orgId,
        paidby: paidBy,
        status: status,
        tokenid: tokenId,
        tokenjson: tokenJson,
        type: type,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);
    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.insertPayment = async (corpId, orgId, invoiceId, capture, chargeId, chargeJson, chargeToken, culqiAmount, email, paidBy, tokenId, tokenJson, location, paymentProvider, requestId) => {
    const queryString = "UFN_INVOICE_PAYMENT";
    const queryParameters = {
        capture: capture,
        chargeid: chargeId,
        chargejson: chargeJson,
        chargetoken: chargeToken,
        corpid: corpId,
        culqiamount: culqiAmount,
        email: email,
        invoiceid: invoiceId,
        location: location,
        orgid: orgId,
        paidby: paidBy,
        paymentprovider: paymentProvider,
        tokenid: tokenId,
        tokenjson: tokenJson,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

exports.getCorrelative = async (corpId, orgId, id, type, requestId) => {
    var queryString = null;
    const queryParameters = {
        corpid: corpId,
        invoiceid: id,
        orgid: orgId,
        _requestid: requestId,
    }

    switch (type) {
        case "INVOICE":
            queryString = "UFN_INVOICE_CORRELATIVE";
            break;
        case "INVOICEERROR":
            queryString = "UFN_INVOICE_CORRELATIVEERROR";
            break;
        case "TICKET":
            queryString = "UFN_INVOICE_TICKETCORRELATIVE";
            break;
        case "TICKETERROR":
            queryString = "UFN_INVOICE_TICKETCORRELATIVEERROR";
            break;
        case "CREDITINVOICE":
            queryString = "UFN_INVOICECREDIT_CORRELATIVE";
            break;
        case "CREDITINVOICEERROR":
            queryString = "UFN_INVOICECREDIT_CORRELATIVEERROR";
            break;
        case "CREDITTICKET":
            queryString = "UFN_INVOICECREDIT_TICKETCREDITCORRELATIVE";
            break;
        case "CREDITTICKETERROR":
            queryString = "UFN_INVOICECREDIT_TICKETCREDITCORRELATIVEERROR";
            break;
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.changeInvoiceBalance = async (corpId, orgId, balanceId, invoiceId, username, requestId) => {
    const queryString = "UFN_BALANCE_CHANGEINVOICE";
    const queryParameters = {
        balanceid: balanceId,
        corpid: corpId,
        invoiceid: invoiceId,
        orgid: orgId,
        username: username,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

exports.changeInvoicePayment = async (corpId, orgId, invoiceId, status, paymentNote, paymentFile, paymentCommentary, username, requestId) => {
    const queryString = "UFN_INVOICE_CHANGEPAYMENTSTATUS";
    const queryParameters = {
        corpid: corpId,
        invoiceid: invoiceId,
        orgid: orgId,
        paymentcommentary: paymentCommentary,
        paymentfile: paymentFile,
        paymentnote: paymentNote,
        status: status,
        username: username,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

exports.changeInvoiceStatus = async (corpId, orgId, invoiceId, status, username, requestId) => {
    const queryString = "UFN_INVOICE_CHANGEINVOICESTATUS";
    const queryParameters = {
        corpid: corpId,
        invoiceid: invoiceId,
        orgid: orgId,
        status: status,
        username: username,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

exports.createBalance = async (corpId, orgId, communicationChannelId, description, status, type, module, receiver, amount, balance, documentType, documentNumber, paymentStatus, transactionDate, transactionUser, username, requestId) => {
    const queryString = "UFN_BALANCE_INS_PAYMENT";
    const queryParameters = {
        amount: amount,
        balance: balance,
        communicationchannelid: communicationChannelId,
        corpid: corpId,
        description: description,
        documentnumber: documentNumber,
        documenttype: documentType,
        module: module,
        orgid: orgId,
        paymentstatus: paymentStatus,
        receiver: receiver,
        status: status,
        transactiondate: transactionDate,
        transactionuser: transactionUser,
        type: type,
        username: username,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0]
        }
    }

    return null;
}

exports.createPaymentCard = async (corpId, orgId, id, cardNumber, cardCode, firstName, lastName, mail, favorite, clientCode, status, phone, type, username, requestId) => {
    const queryString = "UFN_PAYMENTCARD_INS";
    const queryParameters = {
        cardcode: cardCode,
        cardnumber: cardNumber,
        clientcode: clientCode,
        corpid: corpId,
        favorite: favorite,
        firstname: firstName,
        id: id,
        lastname: lastName,
        mail: mail,
        operation: id ? "UPDATE" : "INSERT",
        orgid: orgId,
        status: status,
        phone: phone,
        type: type,
        username: username,
        _requestid: requestId,
    }

    return await triggerfunctions.executesimpletransaction(queryString, queryParameters);
}

exports.deleteInvoiceDetail = async (corpId, orgId, invoiceId, requestId) => {
    const queryString = "UFN_INVOICEDETAIL_DELETE";
    const queryParameters = {
        corpid: corpId,
        invoiceid: invoiceId,
        orgid: orgId,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        return queryResult;
    }

    return null;
}

exports.favoritePaymentCard = async (corpId, requestId) => {
    const queryString = "UFN_PAYMENTCARD_LST";
    const queryParameters = {
        corpid: corpId,
        id: 0,
        orgid: 0,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            var favoriteCard = queryResult.find(card => card.favorite === true);

            if (favoriteCard) {
                return true;
            }
        }
    }

    return false;
}

exports.getAppSettingSingle = async (corpid, orgid, requestId) => {
    const queryString = "UFN_APPSETTING_INVOICE_SEL_SINGLE";
    const queryParameters = {
        corpid: corpid,
        orgid: orgid,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.getCorporation = async (corpId, requestId) => {
    const queryString = "UFN_CORP_SEL";
    const queryParameters = {
        all: false,
        corpid: corpId,
        id: corpId,
        orgid: 0,
        username: "admin",
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.getInvoice = async (corpId, orgId, userId, id, requestId) => {
    const queryString = "UFN_INVOICE_SELBYID";
    const queryParameters = {
        corpid: corpId,
        invoiceid: id,
        orgid: orgId,
        userid: userId,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.getInvoiceDetail = async (corpId, orgId, userId, id, requestId) => {
    const queryString = "UFN_INVOICEDETAIL_SELBYINVOICEID";
    const queryParameters = {
        corpid: corpId,
        invoiceid: id,
        orgid: orgId,
        userid: userId,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult;
        }
    }

    return null
}

exports.getOrganization = async (corpId, orgId, requestId) => {
    if (orgId) {
        const queryString = "UFN_ORG_SEL";
        const queryParameters = {
            all: false,
            corpid: corpId,
            id: orgId,
            orgid: orgId,
            username: "admin",
            _requestid: requestId,
        }

        const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

        if (queryResult instanceof Array) {
            if (queryResult.length > 0) {
                return queryResult[0];
            }
        }
    }

    return null;
}

exports.getPaymentCard = async (corpId, id, requestId) => {
    const queryString = "UFN_PAYMENTCARD_LST";
    const queryParameters = {
        corpid: corpId,
        id: id,
        orgid: 0,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            if (id === 0) {
                return queryResult;
            }
            else {
                return queryResult[0];
            }
        }
    }

    return null;
}

exports.getProfile = async (userId, requestId) => {
    const queryString = "UFN_PROFILE_SEL";
    const queryParameters = {
        userid: userId,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.invoiceSunat = async (corpId, orgId, invoiceId, status, error, qrCode, hashCode, urlCdr, urlPdf, urlXml, serie, issuerRuc, issuerBusinessName, issuerTradeName, issuerFiscalAddress, issuerUbigeo, emitterType, annexCode, printingFormat, sendToSunat, returnPdf, returnXmlSunat, returnXml, token, sunatUrl, sunatUsername, xmlVersion, ublVersion, receiverDocType, receiverDocNum, receiverBusinessName, receiverFiscalAddress, receiverCountry, receiverMail, invoiceType, sunatOpeCode, expirationDate, purchaseOrder, comments, creditType, detractionCode, detraction, detractionAccount, invoiceDate, location, invoiceProvider, correlative, requestId) => {
    const queryString = "UFN_INVOICE_SUNAT";
    const queryParameters = {
        annexcode: annexCode,
        comments: comments,
        correlative: correlative,
        corpid: corpId,
        credittype: creditType,
        detraction: detraction,
        detractionaccount: detractionAccount,
        detractioncode: detractionCode,
        emittertype: emitterType,
        error: error,
        expirationdate: expirationDate,
        hashcode: hashCode,
        invoicedate: invoiceDate,
        invoiceid: invoiceId,
        invoiceprovider: invoiceProvider,
        invoicetype: invoiceType,
        issuerbusinessname: issuerBusinessName,
        issuerfiscaladdress: issuerFiscalAddress,
        issuerruc: issuerRuc,
        issuertradename: issuerTradeName,
        issuerubigeo: issuerUbigeo,
        location: location,
        orgid: orgId,
        printingformat: printingFormat,
        purchaseorder: purchaseOrder,
        qrcode: qrCode,
        receiverbusinessname: receiverBusinessName,
        receivercountry: receiverCountry,
        receiverdocnum: receiverDocNum,
        receiverdoctype: receiverDocType,
        receiverfiscaladdress: receiverFiscalAddress,
        receivermail: receiverMail,
        returnpdf: returnPdf,
        returnxml: returnXml,
        returnxmlsunat: returnXmlSunat,
        sendtosunat: sendToSunat,
        serie: serie,
        status: status,
        sunatopecode: sunatOpeCode,
        sunaturl: sunatUrl,
        sunatusername: sunatUsername,
        token: token,
        ublversion: ublVersion,
        urlcdr: urlCdr,
        urlpdf: urlPdf,
        urlxml: urlXml,
        xmlversion: xmlVersion,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.searchDomain = async (corpId, orgId, all, domainName, username, requestId) => {
    const queryString = "UFN_DOMAIN_VALUES_SEL";
    const queryParameters = {
        all: all,
        corpid: corpId,
        domainname: domainName,
        orgid: orgId,
        username: username,
        _requestid: requestId,
    }

    const queryResult = await triggerfunctions.executesimpletransaction(queryString, queryParameters);

    if (queryResult instanceof Array) {
        if (queryResult.length > 0) {
            return queryResult[0];
        }
    }

    return null;
}

exports.padNumber = (number, places) => String(number).padStart(places, "0");