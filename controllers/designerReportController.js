const { buildQueryDynamic, buildQueryDynamicGroupInterval, buildQueryDynamic2, exportData, executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters, errors, getErrorCode, stringToMinutes, secondsToTime } = require('../config/helpers');

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

    const resultBD = await buildQueryDynamic2(columns, filters, parameters, summaries, true);

    const result = await exportData(resultBD, parameters.reportName, parameters.formatToExport, parameters.headerClient);

    if (!result.error) {
        return res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.exportReportTask = async (req, res) => {
    const { columns, filters, summaries, parameters = {}, user = {} } = req.body;

    parameters.corpid = user.corpid;
    parameters.orgid = user.orgid;
    parameters.username = user.usr;
    parameters.userid = user.userid;

    const resultBD = await buildQueryDynamic2(columns, filters, parameters, summaries, true);

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
            //     "column": "person.name",
            //     "interval": "day|week|month"
            //     "summarizationfunction": "total|count|count_unique|average|minimum|maximum"
            // }

            const queryIndicator = indicatorList.map((r) => r.contentType === "kpi" ? executesimpletransaction("QUERY_GET_KPI", { ...parameters, kpiid: r.kpiid }) : executesimpletransaction("QUERY_GET_REPORTTEMPLATE", { ...parameters, reporttemplateid: r.reporttemplateid }))

            const resultReports = await Promise.all(queryIndicator);
            const result = []
            for (let index = 0; index < resultReports.length; index++) {
                console.log(index)
                const resIndicator = resultReports[index];
                if (resIndicator instanceof Array && resIndicator[0]) {
                    const indicator = indicatorList[index];

                    if (indicator.contentType === "kpi") {
                        result.push(resIndicator[0]); //** SINCRONO */
                        continue;
                    } else {
                        const report = resIndicator[0];
                        const filterHard = [
                            ...JSON.parse(report.filterjson).filter(x => !!x.filter || x.type_filter === 'unique_value').map(x => ({ ...x, value: x.filter})),
                            {
                                columnname: `${report.dataorigin}.createdate`,
                                type: "timestamp without time zone",
                                description: "",
                            join_alias: "",
                            join_on: "",
                            join_table: "",
                            start: parameters.startdate,
                            end: parameters.enddate
                        }]
                        
                        console.log("report.filters", report.filterjson)
                        const columnstmp = JSON.parse(report.columnjson).filter(x => x.columnname === indicator.column);
                        if (columnstmp.length > 0) {
                            if (indicator.interval) {
                                console.log("interval")
                                const restmp = await buildQueryDynamicGroupInterval(columnstmp, filterHard, parameters, indicator.interval, report.dataorigin, indicator.summarizationfunction);
                                result.push(restmp); //** SINCRONO */
                                continue;
                            } else {
                                console.log("normal")
                                const restmp = await buildQueryDynamic2(columnstmp, filterHard, parameters, []);
                                result.push(restmp); //** SINCRONO */
                                continue;
                            }
                        }
                        else {
                            indicatorList[index].error = true;
                            indicatorList[index].errorcode = "COLUMN_NOT_FOUND";
                            result.push([]) //** SINCRONO */
                            continue;
                        }
                    }
                }
                indicatorList[index].error = true;
                indicatorList[index].errorcode = "REPORT_NOT_FOUND";
                result.push(undefined); //** SINCRONO */
                continue;
            }
            console.log(indicatorList)
            
            // const result = await Promise.all(triggerIndicators);

            const cleanDatat = result.map((resIndicator, index) => {
                const { column, contentType, grouping, interval, summarizationfunction } = indicatorList[index];

                if (resIndicator) {
                    if (contentType === "kpi") {
                        return resIndicator;
                    } else {
                        if (interval) {
                            const total = resIndicator.reduce((acc, item) => acc + (typeof item.total === "string" ? stringToMinutes(item.total || "00:00:00") : item.total), 0)
                            console.log(total)
                            resultReports[index][0].total = total;
                            if (!!summarizationfunction) {
                                return resIndicator.reduce((acc, item) => ({
                                    ...acc,
                                    [interval + item.interval]:  typeof item.total === "string" ? stringToMinutes(item.total || "00:00:00") : item.total
                                }), {})
                            } else {
                                return resIndicator.reduce((acc, item) => ({
                                    ...acc,
                                    [interval + item.interval]: acc[interval + item.interval] ? {
                                        ...acc[interval + item.interval],
                                        [item[column.replace(".", "")]]: grouping === "percentage" ? ((typeof item.total === "string" ? stringToMinutes(item.total || "00:00:00") : item.total) / total) * total : item.total
                                    } : {
                                        [item[column.replace(".", "")]]: grouping === "percentage" ? ((typeof item.total === "string" ? stringToMinutes(item.total || "00:00:00") : item.total) / total) * total : item.total
                                    }
                                }), {})
                            }
                        } else {
                            const res = resIndicator.reduce((acc, item) => ({
                                ...acc,
                                [item[column.replace(".", "")] || ""]: (acc[item[column.replace(".", "")] || ""] || 0) + 1
                            }), {});
                            resultReports[index][0].total = resIndicator.length;
                            if (grouping === "percentage") {
                                Object.keys(res).forEach(key => {
                                    res[key] = Number(((res[key] / resIndicator.length) * 100).toFixed(2));
                                })
                            }
                            return res;
                        }
                    }
                } else {
                    return {
                        error: true
                    }
                }
            });
            const gg = cleanDatat.reduce((acc, data, index) => {
                const { contentType, error, errorcode, interval, summarizationfunction } = indicatorList[index];

                if (resultReports[index][0]) {
                    const { description: reportname, columnjson, dataorigin, total } = resultReports[index][0];
                    
                    const sortedData = interval ? data : (contentType === "report" ? Object.fromEntries(Object.entries(data).sort(([, a], [, b]) => b - a)) : data);
                    return {
                        ...acc,
                        [keysIndicators[index]]: {
                            contentType,
                            data: sortedData,
                            reportname,
                            total,
                            dataorigin,
                            interval: !!summarizationfunction ? "" : interval,
                            columns: contentType === "report" ? JSON.parse(columnjson).map(x => ({ ...x, disabled: undefined, descriptionT: undefined })) : undefined,
                            error,
                            errorcode
                        }
                    }
                } else {
                    return {
                        ...acc,
                        [keysIndicators[index]]: {
                            contentType,
                            error,
                            errorcode
                        }
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