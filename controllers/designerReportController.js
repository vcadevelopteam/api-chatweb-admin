const { buildQueryDynamic, buildQueryDynamic2, exportData, executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters, errors, getErrorCode } = require('../config/helpers');

exports.drawReport = async (req, res) => {
    const { columns, filters, summaries, parameters = {} } = req.body;

    setSessionParameters(parameters, req.user);

    const result = await buildQueryDynamic2(columns, filters, parameters, summaries);
    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json(result);
}

exports.exportReport = async (req, res) => {
    const { columns, filters, summaries, parameters = {} } = req.body;

    setSessionParameters(parameters, req.user);

    const resultBD = await buildQueryDynamic2(columns, filters, parameters);

    const result = await exportData(resultBD, parameters.reportName, parameters.formatToExport, parameters.headerClient);

    if (!result.error) {
        return res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.dashboardDesigner = async (req, res) => {
    const { parameters } = req.body;
    //dashboardtemplateid, startdate, enddate
    setSessionParameters(parameters, req.user);
    try {
        const template = await executesimpletransaction("QUERY_GET_DASHBOARDTEMPLATE", parameters);

        if (template instanceof Array && template.length > 0) {
            const templateDashboard = JSON.parse(template[0].detailjson);
            const keysIndicators = Object.keys(templateDashboard);
            const indicatorList = Object.values(templateDashboard);

            const queryToGetReports = indicatorList.map((r) => executesimpletransaction("QUERY_GET_REPORTTEMPLATE", { ...parameters, reporttemplateid: r.reporttemplateid }))

            const resultReports = await Promise.all(queryToGetReports);

            const triggerReports = resultReports.map((resReport, index) => {
                if (resReport instanceof Array && resReport[0]) {
                    const report = resReport[0];
                    const filterHard = [{
                        column: "startdate",
                        start: parameters.startdate,
                        end: parameters.enddate
                    }]

                    const columnstmp = JSON.parse(report.columnjson).filter(x => x.key === indicatorList[index].column);

                    return buildQueryDynamic(columnstmp, filterHard, parameters);
                }
                return undefined;
            });

            const result = await Promise.all(triggerReports);

            const cleanDatat = result.map((resReport, index) => {
                const column = indicatorList[index].column;
                return resReport.reduce((acc, item) => ({
                    ...acc,
                    [item[column] || ""]: (acc[item[column] || ""] || 0) + 1
                }), {});
            });

            const gg = cleanDatat.reduce((acc, data, index) => {
                const reportname = resultReports[index][0].description;
                const columnjson = resultReports[index][0].columnjson;
                const sortedData = Object.fromEntries(Object.entries(data).sort(([, a], [, b]) => b - a));
                return {
                    ...acc,
                    [keysIndicators[index]]: {
                        data: sortedData,
                        reportname,
                        columnjson
                    }
                }
            }, {});
            
            return res.json({ result: gg });
        } else {
            const rr = getErrorCode(errors.UNEXPECTED_ERROR);
            return res.status(rr.rescode).json(rr);
        }
    } catch (ex) {
        console.log(ex);
        const rr = getErrorCode(errors.UNEXPECTED_ERROR);
        return res.status(rr.rescode).json(rr);
    }
}