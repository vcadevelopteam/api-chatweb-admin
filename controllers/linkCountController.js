const { executesimpletransaction } = require('../config/triggerfunctions');

exports.openLink = async (req, res) => {
    const { corpid, orgid, messagetemplateid, historyid, type, link_id, username } = req.body
    const result = await executesimpletransaction("UFN_REPORTLINK_INS", {
        corpid: corpid,
        orgid: orgid,
        messagetemplateid: messagetemplateid,
        historyid: historyid,
        type: type,
        linkregisterid: link_id,
        username: username
    })

    if (!result.error) {
        return res.json({ error: false, success: true});
    }
    else
        return res.status(result.rescode).json(({ ...result }));
}