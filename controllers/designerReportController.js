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

    const resultBD = await buildQueryDynamic2(columns, filters, parameters, summaries);

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

            // { INDICATOR
            //     "description": "prueba 18 01",
            //     "contentType": "report|kpi", 
            //     "reporttemplateid": 160,
            //     "kpiid": 11,
            //     "grouping": "quantity",
            //     "graph": "pie",
            //     "column": "person.name"
            // }
            const queryIndicator = indicatorList.map((r) => r.contentType === "kpi" ? executesimpletransaction("QUERY_GET_KPI", { ...parameters, kpiid: r.kpiid }) : executesimpletransaction("QUERY_GET_REPORTTEMPLATE", { ...parameters, reporttemplateid: r.reporttemplateid }))

            const resultReports = await Promise.all(queryIndicator);

            const triggerIndicators = resultReports.map((resIndicator, index) => {
                if (resIndicator instanceof Array && resIndicator[0]) {
                    const indicator = indicatorList[index];

                    if (indicator.contentType === "kpi") {
                        return resIndicator[0];
                    } else {
                        const report = resIndicator[0];
                        const filterHard = [{
                            columnname: `${report.dataorigin}.createdate`,
                            type: "timestamp without time zone",
                            description: "",
                            join_alias: "",
                            join_on: "",
                            join_table: "",
                            start: parameters.startdate,
                            end: parameters.enddate
                        }]

                        const columnstmp = JSON.parse(report.columnjson).filter(x => x.columnname === indicator.column);

                        return buildQueryDynamic2(columnstmp, filterHard, parameters, []);
                    }
                }
                return undefined;
            });

            const result = await Promise.all(triggerIndicators);

            const cleanDatat = result.map((resIndicator, index) => {
                const indicator = indicatorList[index];

                if (indicator.contentType === "kpi") {
                    return resIndicator;
                } else {
                    const { column } = indicator;
                    return resIndicator.reduce((acc, item) => ({
                        ...acc,
                        [item[column.replace(".", "")] || ""]: (acc[item[column.replace(".", "")] || ""] || 0) + 1
                    }), {});
                }
            });

            const gg = cleanDatat.reduce((acc, data, index) => {
                const { contentType } = indicatorList[index];

                const { description: reportname, columnjson, dataorigin } = resultReports[index][0];

                const sortedData = contentType === "report" ? Object.fromEntries(Object.entries(data).sort(([, a], [, b]) => b - a)) : data;
                return {
                    ...acc,
                    [keysIndicators[index]]: {
                        contentType,
                        data: sortedData,
                        reportname,
                        dataorigin,
                        columns: contentType === "report" ? JSON.parse(columnjson).map(x => ({ ...x, disabled: undefined, descriptionT: undefined })) : undefined
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