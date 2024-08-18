const { buildQueryDynamic, buildQueryDynamicGroupInterval, buildQueryDynamic2, exportData, executesimpletransaction } = require('../config/triggerfunctions');
const { setSessionParameters, errors, getErrorCode, stringToMinutes, secondsToTime } = require('../config/helpers');

exports.drawReport = async (req, res) => {
    const { columns, filters, summaries, parameters = {} } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    const result = await buildQueryDynamic2(columns, filters, parameters, summaries, false, req.user);
    if (!result.error)
        return res.json(result);
    else
        return res.status(result.rescode).json(result);
}

exports.exportReport = async (req, res) => {
    const { columns, filters, summaries, parameters = {} } = req.body;

    setSessionParameters(parameters, req.user, req._requestid);

    const resultBD = await buildQueryDynamic2(columns, filters, parameters, summaries, true, req.user);

    const result = await exportData(resultBD, parameters.reportName, parameters.formatToExport, parameters.headerClient, req._requestid);

    if (!result.error) {
        return res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.exportTask = async (req, res) => {
    const { columns, filters, summaries, parameters = {}, user = {} } = req.body;

    parameters.corpid = user.corpid;
    parameters.orgid = user.orgid;
    parameters.username = user.usr;
    parameters.userid = user.userid;

    const resultBD = await buildQueryDynamic2(columns, filters, parameters, summaries, true);

    const result = await exportData(resultBD, parameters.reportName, parameters.formatToExport, parameters.headerClient, req._requestid);

    if (!result.error) {
        return res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.exportData = async (req, res) => {
    const { columns, filters, summaries, parameters = {}, user = {} } = req.body;

    parameters.corpid = user.corpid;
    parameters.orgid = user.orgid;
    parameters.username = user.usr;
    parameters.userid = user.userid;

    const resultBD = await buildQueryDynamic2(columns, filters, parameters, summaries, true);

    const result = { data: resultBD };

    if (!result.error) {
        return res.json(result);
    } else {
        return res.status(result.rescode).json(result);
    }
}

exports.dashboardDesigner = async (req, res) => {
    const { parameters } = req.body;
    //dashboardtemplateid, startdate, enddate
    setSessionParameters(parameters, req.user, req._requestid);
    try {
        const template = await executesimpletransaction("QUERY_GET_DASHBOARDTEMPLATE", parameters);
        if (template instanceof Array && template.length > 0) {

            const templateDashboard = JSON.parse(template[0].detailjson);
            const keysIndicators = Object.keys(templateDashboard);
            const indicatorList = Object.values(templateDashboard);

            // { INDICATOR
            //     "description": "prueba 18 01",
            //     "contentType": "report|kpi|funnel", 
            //     "funnelType": "byway|bycount", 
            //     "reporttemplateid": 160,
            //     "kpiid": 11,
            //     "grouping": "quantity",
            //     "graph": "pie",
            //     "column": "person.name",
            //     "interval": "day|week|month"
            //     "summarizationfunction": "total|count|count_unique|average|minimum|maximum",
            //     "tags": [{value, title}]
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
                        
                        

                        const filterHard = [
                            ...JSON.parse(report.filterjson).filter(x => !!x.filter || (x.type_filter === 'unique_value' && !x.type?.includes("timestamp"))).map(x => ({ ...x, value: x.filter })),
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

                        const columnstmp = JSON.parse(report.columnjson).filter(x => x.columnname === indicator.column);
                        if (columnstmp.length > 0) {
                            if (indicator.interval) {
                                return buildQueryDynamicGroupInterval(columnstmp, filterHard, parameters, indicator.interval, report.dataorigin, indicator.summarizationfunction);
                            } else {
                                return buildQueryDynamic2(columnstmp, filterHard, parameters, [], false, req.user);
                            }
                        }
                        else {
                            indicatorList[index].error = true;
                            indicatorList[index].errorcode = "COLUMN_NOT_FOUND";
                            return []
                        }
                    }
                }
                indicatorList[index].error = true;
                indicatorList[index].errorcode = "REPORT_NOT_FOUND";
                return undefined;
            });

            const result = await Promise.all(triggerIndicators);

            const cleanDatat = result.map((resIndicator, index) => {
                const { column, contentType, funnelType = "byway", grouping, interval, summarizationfunction, tags } = indicatorList[index];

                if (resIndicator) {
                    if (contentType === "kpi") {
                        return resIndicator;
                    } else {
                        if (interval) {
                            const total = resIndicator.reduce((acc, item) => acc + ((typeof item.total === "string" && item.total.includes(":")) ? stringToMinutes(item.total || "00:00:00") : item.total), 0)

                            resultReports[index][0].total = total;
                            if (summarizationfunction) {
                                return resIndicator.reduce((acc, item) => ({
                                    ...acc,
                                    [interval + item.interval]: (typeof item.total === "string" && item.total.includes(":")) ? stringToMinutes(item.total || "00:00:00") : item.total
                                }), {})
                            } else {
                                return resIndicator.reduce((acc, item) => ({
                                    ...acc,
                                    [interval + item.interval]: acc[interval + item.interval] ? {
                                        ...acc[interval + item.interval],
                                        [item[column.replace(".", "")]]: grouping === "percentage" ? (((typeof item.total === "string" && item.total.includes(":")) ? stringToMinutes(item.total || "00:00:00") : item.total) / total) * total : item.total
                                    } : {
                                        [item[column.replace(".", "")]]: grouping === "percentage" ? (((typeof item.total === "string" && item.total.includes(":")) ? stringToMinutes(item.total || "00:00:00") : item.total) / total) * total : item.total
                                    }
                                }), {})
                            }
                        } else if (contentType === "funnel") {
                            if (funnelType === "byway") {
                                const tagsToSearch = tags.reduce((acc, item) => ([
                                    ...acc,
                                    (acc.length > 0 ? item.value + "," + acc[acc.length - 1] : item.value)
                                ]), []).map(x => `,${x},`);

                                const resCleaned = resIndicator.reduce((acc, item) => {
                                    const columnTag = item[column.replace(".", "")];
                                    if (columnTag) {
                                        // clean tags, example t1,t2,t2,t2,t3 => t1,t2,t3
                                        const tagsCleaned = columnTag.split(',').reduce((accx, itemx) => ({
                                            lastTag: itemx,
                                            acc: accx.lastTag === itemx ? accx.acc : [...accx.acc, itemx]
                                        }), { lastTag: '', acc: [] })

                                        const ts = `,${tagsCleaned.acc.join(",")},`; //column tags

                                        return tagsToSearch.reduce((acc2, item2) => ({
                                            ...acc2,
                                            [item2]: (acc[item2] || 0) + (ts.includes(item2) ? 1 : 0)
                                        }), acc)
                                    } else {
                                        return acc;
                                    }
                                }, tagsToSearch.reduce((acc1, item1) => ({ ...acc1, [item1]: 0 }), {}))

                                return Object.entries(resCleaned).map(([key, value], index) => ({
                                    title: tags[index].title,
                                    quantity: value,
                                    path: key
                                }))
                            } else {
                                const tags1 = tags.map(x => `,${x.value},`);

                                const resCleaned = resIndicator.reduce((acc, item) => {
                                    const columnTag = item[column.replace(".", "")];
                                    if (columnTag) {
                                        const ts = `,${columnTag},`; //column tags

                                        return tags1.reduce((acc2, item2) => ({
                                            ...acc2,
                                            [item2]: (acc[item2] || 0) + (ts.includes(item2) ? 1 : 0)
                                        }), acc)
                                    } else {
                                        return acc;
                                    }
                                }, tags1.reduce((acc1, item1) => ({ ...acc1, [item1]: 0 }), {}));

                                return tags.map(x => {
                                    return {
                                        title: x.title,
                                        quantity: resCleaned[`,${x.value},`] || 0,
                                        path: x.value
                                    }
                                });
                                // return Object.entries(resCleaned).map(([key, value], index) => ({
                                //     title: tags[index].title,
                                //     quantity: value,
                                //     path: key
                                // })).sort((a, b) => b.quantity - a.quantity)
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
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}