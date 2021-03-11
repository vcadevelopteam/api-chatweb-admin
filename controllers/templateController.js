const triggerfunctions = require('../config/triggerfunctions');;
var ibm = require('ibm-cos-sdk');

var config = {
    endpoint: 's3.us-east.cloud-object-storage.appdomain.cloud',
    ibmAuthEndpoint: 'https://iam.cloud.ibm.com/identity/token',
    apiKeyId: 'LwD1YXNXSp8ZYMGIUWD2D3-wmHkmWRVcFm-5a1Wz_7G1', //'GyvV7NE7QiuAMLkWLXRiDJKJ0esS-R5a6gc8VEnFo0r5',
    serviceInstanceId: '0268699b-7d23-4e1d-9d17-e950b6804633' //'9720d58a-1b9b-42ed-a246-f2e9d7409b18',
};
const COS_BUCKET_NAME = "staticfileszyxme"

exports.InsertMassiveLoad = async ({ tmpjson, loadtemplateid, countrepeated }) => {
    const restemplate = await triggerfunctions.executequery(`select name, json_detail, tablename, cleanbeforeload, callbackfunction from loadtemplate where loadtemplateid = ${loadtemplateid}`);

    const { json_detail: jsonTemplate, tablename, name, cleanbeforeload, callbackfunction } = restemplate[0];
    const typename = "json" + name;

    const objectString = JSON.parse(jsonTemplate).reduce((objectString, row) => ({
        into: objectString.into + `${row.columnbd},`,
        sel: objectString.sel + `j.${row.columnbd},`
    }), { into: `INSERT INTO ${tablename}(`, sel: 'SELECT ' });

    objectString.into = objectString.into.substring(0, objectString.into.length - 1) + ")";
    objectString.sel = objectString.sel.substring(0, objectString.sel.length - 1) + ` FROM json_populate_recordset(null::${typename}, '${tmpjson}'::json) j;`;
    if (cleanbeforeload && countrepeated === 0) {
        await triggerfunctions.executequery(`delete from ${tablename}`);
    }
    const result = await triggerfunctions.executequery(objectString.into + " " + objectString.sel);

    if (callbackfunction) {
        await triggerfunctions.executequery(`select * from ${callbackfunction}()`);
    }

    return result
}

exports.MassiveLoad = async (req, res) => {
    try {
        const result = await this.InsertMassiveLoad(req.body.data);

        if (result instanceof Array)
            return res.json(result);
        else
            return res.status(500).json(result);

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }

}

exports.Export = async (req, res) => {
    try {
        const { data: { tablename, query, select, filename, delimiter } } = req.body;
        const fullquery = `select ${select} from ${tablename} ${query} `;
        
        const result = await triggerfunctions.executequery(fullquery);
        const titlefile = (filename ? filename : "exportdynamic") + new Date().toISOString() + ".csv";
        const delimiteroficial = delimiter || ",";
        console.time(`draw-excel`);
        let content = "";
        if (result instanceof Array) {
            content += Object.keys(result[0]).join(delimiteroficial) + "\n";

            result.forEach((rowdata) => {
                let rowjoined = Object.values(rowdata).join("##");
                if (rowjoined.includes(delimiteroficial)) {
                    rowjoined = Object.values(rowdata).map(x => (x && typeof x === "string") ? (x.includes(delimiteroficial) ? `"${x}"` : x) : x).join();
                } else {
                    rowjoined = rowjoined.replace(/##/gi, delimiteroficial);
                }
                content += rowjoined + "\n";
            });
        } else {
            result.msg += " " + fullquery;
            return res.status(500).json(result);
        }
        console.timeEnd(`draw-excel`);

        var s3 = new ibm.S3(config);


        const params = {
            ACL: 'public-read',
            Key: titlefile,
            Body: Buffer.from(content, 'ASCII'),
            Bucket: COS_BUCKET_NAME,
            ContentType: "text/csv",
        }
        console.time(`uploadcos`);
        s3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, msg: 'Hubo un error#1 en la carga de archivo.', err })
            }
            console.log(data);
            console.timeEnd(`uploadcos`);
            return res.json({ success: true, url: data.Location })
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }

}

exports.Insert = async (req, res) => {
    try {
        const { data, method } = req.body;

        if (!data.corporation)
            data.corporation = req.usuario.corporation;
        if (!data.corpid)
            data.corpid = req.usuario.corpid ? req.usuario.corpid : 1;
        if (!data.orgid)
            data.orgid = req.usuario.orgid ? req.usuario.orgid : 1;
        if (!data.username)
            data.username = req.usuario.usr;
        if (!data.userid)
            data.userid = req.usuario.userid;

        const jsondetail = JSON.parse(data.json_detail);

        if (data.loadtemplateid) {
            await triggerfunctions.executequery(`drop type json${data.name}`);
        }

        let queryCreateType = jsondetail.reduce((html, row) => html + `${row.columnbd} ${row.type},`, "");
        queryCreateType = `CREATE TYPE public.json${data.name} AS ( ${queryCreateType.substring(0, queryCreateType.length - 1)} );`;
        await triggerfunctions.executequery(queryCreateType);

        const result = await triggerfunctions.executesimpletransaction(method, data);
        if (result instanceof Array)
            return res.json(result);
        else
            return res.status(500).json(result);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: "Hubo un problema, intentelo más tarde"
        });
    }
}