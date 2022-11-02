const axios = require('axios');
const xlsx = require('xlsx');

exports.getFileRequest = async ({method = "post", url, data = undefined,headers = undefined, timeout}) => {
    return await axios({
        method,
        url,
        data,
        headers,
        responseType: 'arraybuffer',
        timeout: timeout || 600000
    });
    
}

exports.extractDataFile = (isXml, data, catalogid, catalogname, isvalid) => {    
    if(isXml){ 
        return getXmlFile(data,catalogid, catalogname, isvalid);
    } else {
        return getXlsxFile(data,catalogid, catalogname, isvalid);
    }
}

const getXmlFile = (data, catalogid, catalogname, isvalid) => {
    var parser = require('xml2json');
    const jsondata = JSON.parse(parser.toJson(data));
    let simplifiedData = jsondata.rss.channel.item.map(x => {
        let customlabels = Object.keys(x).filter(y => y.indexOf("custom_label") >= 0)
        var table =  {
            productid: x["g:id"] || null,
            title: x["g:title"] || null,
            link: x["g:link"] || null,
            imagelink: x["g:image_link"] || null,
            additionalimagelink: JSON.stringify(x["g:additional_image_link"]) || null,
            brand: x["g:brand"] || null,
            condition: x["g:condition"] || null,
            availability: x["g:availability"] || null,
            category: x["g:google_product_category"] || null,
            material: x["g:material"] || null,
            color: x["g:color"] || null,
            pattern: x["g:pattern"] || null,
            currency: x["g:currency"] || 'PEN',
            price: x["g:price"] || 0.00,
            saleprice: x["g:sale_price"] || 0.00,
            customlabel1: x["g:custom_label_0"] || null,
            customlabel2: x["g:custom_label_1"] || null,
            customlabel3: x["g:custom_label_2"] || null,
            customlabel4: x["g:custom_label_3"] || null,
            customlabel5: x["g:custom_label_4"] || null,
            labels: customlabels ? customlabels.map(y => typeof x[y] === "object" ? JSON.stringify(x[y]) : x[y]).join(',') : null,
            catalogid: catalogid || null,
            catalogname: catalogname || null,
            description: x["g:description"],
            status: x["g:status"] || 'ACTIVO',
            type: x["g:type"] || null,
        }
        if(isvalid) {
            isvalid = (table.productid && table.title && table.description && table.link && 
                table.imagelink && table.brand && table.condition && table.availability
                && table.price && table.currency);
        }
        
        
            return table;
    });

    return simplifiedData;
}

const getXlsxFile =  (data, catalogid, catalogname, isvalid) => {
    const workbook = xlsx.read(data);
    
    const worksheetName = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[worksheetName];
    let dataRows = xlsx.utils.sheet_to_json(worksheet,{header: 2});
    
    let simplifiedData = dataRows.map((field) => {
        let customlabels = [field.custom_label_0,field.custom_label_1,field.custom_label_2,field.custom_label_3,field.custom_label_4];
        var table = {
            productid: field.id || null,
            title: field.title || null,
            description: field.description,
            link: field.link || null,
            imagelink: field.image_link || null,
            brand: field.brand || null,
            condition: field.condition || null,
            availability: field.availability || null,
            price: field.price || 0.00,
            currency: field.currency || 'PEN',
            category: field.google_product_category || null,
            additionalimagelink: field.additional_image_link || null,
            material: field.material || null,
            color: field.color || null,
            pattern: field.pattern || null,
            saleprice: field.sale_price || 0.00,
            customlabel1: field.custom_label_0 || null,     
            customlabel2: field.custom_label_1 || null,
            customlabel3: field.custom_label_2 || null,
            customlabel4: field.custom_label_3 || null,
            customlabel5: field.custom_label_4 || null,
            labels: customlabels ? customlabels.join(',') : null,
            catalogid: catalogid || null,
            catalogname: catalogname || null,            
            status: field.status || 'ACTIVO'
        }
        if(isvalid) {
            isvalid = (table.productid && table.title && table.description && table.link && 
                table.imagelink && table.brand && table.condition && table.availability
                && table.price && table.currency);
        }       

        return table;
    });
    
    return simplifiedData;
}