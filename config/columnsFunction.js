module.exports = {
    post: {
        facebookpostid: {
            column: 'fp.facebookpostid',
            type: 'int'
        },
        message: {
            column: 'fp.message',
            type: 'string'
        },
        media: {
            column: 'fp.media',
            type: 'string'
        },
        type: {
            column: 'fp.type',
            type: 'string'
        },
        commentnumber: {
            column: 'fp.commentnumber',
            type: 'int'
        },
        likenumber: {
            column: 'fp.likenumber',
            type: 'int'
        },
        sharednumber: {
            column: 'fp.sharednumber',
            type: 'int'
        },
        watsonclass: {
            column: 'fp.watsonclass',
            type: 'string'
        },
        watsonsubclass: {
            column: 'fp.watsonsubclass',
            type: 'string'
        },
        userid: {
            column: 'fp.userid',
            type: 'string'
        },
        fullname: {
            column: 'fu.fullname',
            type: 'string'
        },
        externalid: {
            column: 'fp.externalid',
            type: 'string'
        },
        facebookid: {
            column: 'fp.facebookid',
            type: 'string'
        },
        parentid: {
            column: 'fp.parentid',
            type: 'string'
        },
        postid: {
            column: 'fp.postid',
            type: 'string'
        },
        fechafilter: {
            column: "(fp.datetimecreated ###OFFSET### * interval '1hour')::DATE",
            type: 'string'
        },
        clienttype: {
            column: "fu.clienttype",
            type: 'string'
        },
        phonenumber: {
            column: "fu.phonenumber",
            type: 'string'
        },
        document: {
            column: "fu.document",
            type: 'string'
        },
        post: {
            column: "coalesce(fp2.message, fp2.story, fp2.media)",
            type: 'string'
        },
        email: {
            column: "fu.mailaddress",
            type: 'string'
        },
        customerfullname: {
            column: "fu.customerfullname",
            type: 'string'
        },
        nluanger: {
            column: "fp.nluanger",
            type: "string"
        },
        nludisgust: {
            column: "fp.nludisgust",
            type: "string"
        },
        nlufear: {
            column: "fp.nlufear",
            type: "string"
        },
        nlujoy: {
            column: "fp.nlujoy",
            type: "string"
        },
        nlusadness: {
            column: "fp.nlusadness",
            type: "string"
        },
        nlusentiment: {
            column: "fp.nlusentiment",
            type: "string"
        },
        nluentities: {
            column: "fp.nluentities",
            type: "string"
        },
        nlukeywords: {
            column: "fp.nlukeywords",
            type: "string"
        },
        datetimecreated: {
            column: "to_char(fp.datetimecreated ###OFFSET### * interval '1hour', 'dd/MM/yyyy hh24:mi:ss')",
            type: "string"
        },
    }
}