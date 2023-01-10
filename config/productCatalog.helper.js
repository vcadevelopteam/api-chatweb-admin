const axios = require('axios');
const xlsx = require('xlsx');
const xml2json = require('xml2json');

exports.getFileRequest = async ({ method = "post", url, data = undefined, headers = undefined, timeout }) => {
    return await axios({
        method,
        url,
        data,
        headers,
        responseType: 'arraybuffer',
        timeout: timeout || 600000
    });
}

exports.extractDataFile = (isxml, data, metacatalogid, override) => {
    if (isxml) {
        return getXmlFile(data, metacatalogid, override);
    } else {
        return getXlsxFile(data, metacatalogid, override);
    }
}

const getXmlFile = (data, metacatalogid, override) => {
    let isvalid = true;

    const jsondata = JSON.parse((xml2json.toJson(data) || '').split("{}").join("null"));

    if (!(jsondata.rss.channel.item instanceof Array)) {
        jsondata.rss.channel.item = [jsondata.rss.channel.item];
    }

    let simplifiedData = jsondata.rss.channel.item.map(x => {
        let customlabels = Object.keys(x).filter(y => y.indexOf("custom_label") >= 0);
        var table = {
            metacatalogid: metacatalogid || 0,
            productid: x["g:id"] || '',
            retailerid: '',
            title: x["g:title"] || '',
            description: x["g:description"] || '',
            descriptionshort: x["g:short_description"] || '',
            availability: x["g:availability"] || '',
            category: x["g:google_product_category"] || '',
            condition: x["g:condition"] || '',
            currency: x["g:currency"] || 'PEN',
            price: x["g:price"] || 0.00,
            saleprice: x["g:sale_price"] || 0.00,
            link: x["g:link"] || '',
            imagelink: x["g:image_link"] || '',
            additionalimagelink: x["g:additional_image_link"] || '',
            brand: x["g:brand"] || '',
            color: x["g:color"] || '',
            gender: x["g:gender"] || '',
            material: x["g:material"] || '',
            pattern: x["g:pattern"] || '',
            size: x["g:size"] || '',
            datestart: x["g:start_date"] || null,
            datelaunch: x["g:launch_date"] || null,
            dateexpiration: x["g:expiration_date"] || null,
            labels: customlabels ? customlabels.map(y => typeof x[y] === "object" ? JSON.stringify(x[y]) : x[y]).join(',') : '',
            customlabel0: x["g:custom_label_0"] || '',
            customlabel1: x["g:custom_label_1"] || '',
            customlabel2: x["g:custom_label_2"] || '',
            customlabel3: x["g:custom_label_3"] || '',
            customlabel4: x["g:custom_label_4"] || '',
            reviewstatus: x["g:review_status"] || 'approved',
            status: x["g:status"] || 'ACTIVO',
            type: x["g:type"] || '',
        }
        if (isvalid) {
            isvalid = (table.productid && table.title && table.description && table.link &&
                table.imagelink && table.brand && table.condition && table.availability
                && table.price && table.currency) ? true : false;
        }

        return table;
    });

    if (isvalid || override) {
        return simplifiedData;
    }
    else {
        return null;
    }
}

const getXlsxFile = (data, metacatalogid, override) => {
    let isvalid = true;

    const workbook = xlsx.read(data);

    const worksheetName = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[worksheetName];
    let dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 2 });

    let simplifiedData = dataRows.map((field) => {
        let customlabels = [field.custom_label_0, field.custom_label_1, field.custom_label_2, field.custom_label_3, field.custom_label_4];
        var table = {
            metacatalogid: metacatalogid || 0,
            productid: field.id || '',
            retailerid: '',
            title: field.title || '',
            description: field.description || '',
            descriptionshort: field.short_description || '',
            availability: field.availability || '',
            category: field.google_product_category || '',
            condition: field.condition || '',
            currency: field.currency || 'PEN',
            price: field.price || 0.00,
            saleprice: field.sale_price || 0.00,
            link: field.link || '',
            imagelink: field.image_link || '',
            additionalimagelink: field.additional_image_link || '',
            brand: field.brand || '',
            color: field.color || '',
            gender: field.gender || '',
            material: field.material || '',
            pattern: field.pattern || '',
            size: field.size || '',
            datestart: field.start_date || null,
            datelaunch: field.launch_date || null,
            dateexpiration: field.expiration_date || null,
            labels: customlabels ? customlabels.join(',') : '',
            customlabel0: field.custom_label_0 || '',
            customlabel1: field.custom_label_1 || '',
            customlabel2: field.custom_label_2 || '',
            customlabel3: field.custom_label_3 || '',
            customlabel4: field.custom_label_4 || '',
            reviewstatus: field.review_status || 'approved',
            status: field.status || 'ACTIVO',
            type: field.type || '',
        }
        if (isvalid) {
            isvalid = (table.productid && table.title && table.description && table.link &&
                table.imagelink && table.brand && table.condition && table.availability
                && table.price && table.currency) ? true : false;
        }

        return table;
    });

    if (isvalid || override) {
        return simplifiedData;
    }
    else {
        return null;
    }
}