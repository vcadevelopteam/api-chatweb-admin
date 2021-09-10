module.exports = {
    inputretry: {
        numeroticket: {
            column: "co.ticketnum"
        },
        cliente: {
            column: "pe.name"
        },
        canal: {
            column: "cc.description"
        },
        fecha: {
            column: "to_char(inter.createdate + '||p_offset||' * INTERVAL ''1hour'', ''DD/MM/YYYY HH24:MI:SS'')"
        },
        pregunta: {
            column: "inter.inputquestion"
        },
        respuesta: {
            column: "inter.interactiontext"
        },
        valido: {
            column: "CASE WHEN inter.validinput THEN ''SI'' ELSE ''NO'' END"
        },
        intento: {
            column: "inter.attempt"
        }
    },
    tipification: {
        numeroticket: {
            column: "co.ticketnum"
        },
        anioticket: {
            column: "extract(year from (co.startdate - interval ''5 hour''))::character varying"
        },
        mesticket: {
            column: "extract(month from (co.startdate - interval ''5 hour''))::character varying"
        },
        fechaticket: {
            column: "to_char(co.startdate - interval ''5 hour'', ''DD/MM/YYYY'')::character varying"
        },
        horaticket: {
            column: "to_char(co.startdate - interval ''5 hour'' :: time, ''HH24:MI:SS'')::character varying"
        },
        cliente: {
            column: "pe.name"
        },
        numerodocumento: {
            column: "pe.documentnumber"
        },
        asesor: {
            column: "concat(us.firstname,'' '',us.lastname)::character varying"
        },
        canal: {
            column: "cc.description canal"
        },
        tipo: {
            column: "coalesce(cl2.description, cl1.description)"
        },
        submotivo: {
            column: "case when cl2.description is null then cl.description else cl1.description end"
        },
        valoracion: {
            column: "case when cl2.description is null then null else cl.description end"
        },
        fechafin: {
            column: "to_char(co.finishdate - interval ''5 hour'', ''YYYY-MM-DD'')::character varying"
        },
        horafin: {
            column: "to_char(co.finishdate - interval ''5 hour'' :: time, ''HH24:MI:SS'')::character varying"
        },
        fechaprimerainteraccion: {
            column: "CASE WHEN ou.type <> ''BOT'' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) - interval ''5 hour'', ''YYYY-MM-DD''), to_char((co.startdate + co.userfirstreplytime) - interval ''5 hour'', ''YYYY-MM-DD'')) ELSE null END ::character varying"
        },
        horaprimerainteraccion: {
            column: "CASE WHEN ou.type <> ''BOT'' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) - interval ''5 hour'' :: time, ''HH24:MI:SS''), to_char((co.startdate + co.userfirstreplytime) - interval ''5 hour'' :: time, ''HH24:MI:SS'')) ELSE null END ::character varying"
        },
        cerradopor: {
            column: "ou.type"
        },
        tipocierre: {
            column: "coalesce(do2.domaindesc, co.closetype)"
        },
        displayname: {
            column: "pcc.displayname"
        },
        phone: {
            column: "pe.phone"
        },
        contact: {
            column: "pe.contact"
        }
    },
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