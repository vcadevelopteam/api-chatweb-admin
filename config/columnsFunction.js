module.exports = {
    person: {
        corpid: {
            column: "pe.corpid"
        },
        corpdesc: {
            column: "corp.description as corpdesc"
        },
        orgid: {
            column: "pe.orgid"
        },
        orgdesc: {
            column: "org.description as orgdesc"
        },
        personid: {
            column: "pe.personid"
        },
        description: {
            column: "pe.description"
        },
        groups: {
            column: "pe.groups"
        },
        status: {
            column: "pe.status"
        },
        type: {
            column: "pe.type,"
        },
        name: {
            column: "pe.name"
        },
        persontype: {
            column: "pe.persontype"
        },
        personstatus: {
            column: "pe.personstatus"
        },
        phone: {
            column: "pe.phone"
        },
        email: {
            column: "pe.email"
        },
        alternativephone: {
            column: "pe.alternativephone"
        },
        alternativeemail: {
            column: "pe.alternativeemail"
        },
        firstcontact: {
            column: "to_char(pe.firstcontact + '||p_offset||' * interval ''1hour'', ''DD/MM/YYYY HH24:MI:SS'') firstcontact"
        },
        lastcontact: {
            column: "to_char(pe.lastcontact + '||p_offset||' * interval ''1hour'', ''DD/MM/YYYY HH24:MI:SS'') lastcontact"
        },
        lastcommunicationchannelid: {
            column: "pe.lastcommunicationchannelid"
        },
        communicationchannelname: {
            column: "cc.description communicationchannelname"
        },
        documenttype: {
            column: "pe.documenttype"
        },
        documentnumber: {
            column: "pe.documentnumber"
        },
        firstname: {
            column: "pe.firstname"
        },
        lastname: {
            column: "pe.lastname"
        },
        imageurldef: {
            column: "pe.imageurldef"
        },
        sex: {
            column: "pe.sex"
        },
        gender: {
            column: "pe.gender"
        },
        birthday: {
            column: "pe.birthday"
        },
        civilstatus: {
            column: "pe.civilstatus"
        },
        occupation: {
            column: "pe.occupation"
        },
        educationlevel: {
            column: "pe.educationlevel,"
        },
        country: {
            column: "pe.country"
        },
        region: {
            column: "pe.region"
        },
        province: {
            column: "pe.province"
        },
        district: {
            column: "pe.district"
        },
        latitude: {
            column: "pe.latitude"
        },
        longitude: {
            column: "pe.longitude"
        },
        referringpersonid: {
            column: "pe.referringpersonid"
        },
        referringpersonname: {
            column: "pe2.name referringpersonname"
        },
        displayname: {
            column: "pcc.displayname"
        },
        locked: {
            column: "pcc.locke"
        },
    }
}