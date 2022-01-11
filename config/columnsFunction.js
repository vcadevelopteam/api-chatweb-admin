module.exports = {
    inputretry: {
        ticketnum: {
            column: "co.ticketnum"
        },
        channel: {
            column: "cc.description"
        },
        person: {
            column: "pe.name"
        },
        datehour: {
            column: "inter.createdate",
            type: "date"
        },
        question: {
            column: "inter.inputquestion"
        },
        answer: {
            column: "inter.interactiontext"
        },
        attempt: {
            column: "inter.attempt"
        },
        valid: {
            column: "inter.validinput",
            type: "boolean"
        },
    },
    tipification: {
        ticket: {
            column: "co.ticketnum"
        },
        datehour: {
            column: "co.startdate",
            type: "date"
        },
        person: {
            column: "pcc.displayname"
        },
        phone: {
            column: "pe.phone"
        },
        agent: {
            column: "concat(us.firstname,' ',us.lastname)"
        },
        channel: {
            column: "cc.description"
        },
        classificationlevel1: {
            column: "coalesce(cl2.description, cl1.description)"
        },
        classificationlevel2: {
            column: "case when cl2.description is null then cl.description else cl1.description end"
        },
        classificationlevel3: {
            column: "case when cl2.description is null then null else cl.description end"
        },
    },
    interaction: {
        ticketnum: {
            column: "co.ticketnum"
        },
        ticketyear: {
            column: "to_char(co.startdate + $offset * INTERVAL '1hour','YYYY')"
        },
        ticketmonth: {
            column: "to_char(co.startdate + $offset * INTERVAL '1hour','MM')"
        },
        ticketdatehour: {
            column: "co.startdate",
            type: "date"
        },
        interactionid: {
            column: "inter.interactionid"
        },
        interactiondatehour: {
            column: "inter.createdate",
            type: "date"
        },
        person: {
            column: "pe.name"
        },
        originalname: {
            column: "pcc.displayname"
        },
        channel: {
            column: "cc.description"
        },
        agent: {
            column: "concat(us.firstname,' ',us.lastname)"
        },
        intent: {
            column: "inter.intent"
        },
        interactiontype: {
            column: "inter.interactiontype"
        },
        interactiontext: {
            column: "inter.interactiontext"
        },
        clientnumber: {
            column: "pe.phone"
        },
        personcommunicationchannel: {
            column: "co.personcommunicationchannel"
        },
    },
    productivity: {
        ticket: {
            column: "co.ticketnum"
        },
        ticketyear: {
            column: "extract(year from co.startdate + p_offset * INTERVAL '1hour')::BIGINT"
        },
        ticketmonth: {
            column: "extract(month from co.startdate + p_offset * INTERVAL '1hour')::BIGINT"
        },
        ticketweek: {
            column: "extract(week from co.startdate + p_offset * INTERVAL '1hour')::BIGINT"
        },
        ticketday: {
            column: "extract(day from co.startdate + p_offset * INTERVAL '1hour')::BIGINT"
        },
        tickethour: {
            column: "extract(hour from co.startdate + p_offset * INTERVAL '1hour')::BIGINT"
        },
        channel: {
            column: "cc.description"
        },
        client: {
            column: "pe.name"
        },
        person: {
            column: "pcc.displayname"
        },
        closedby: {
            column: "ou.type"
        },
        agent: {
            column: "concat(us.firstname,' ',us.lastname)"
        },
        closetype: {
            column: "coalesce(do2.domaindesc, co.closetype)"
        },
        startdate: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')"
        },
        starttime: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')"
        },
        enddate: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')"
        },
        endtime: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')"
        },
        derivationdate: {
            column: "coalesce(to_char(co.handoffdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY'),'')"
        },
        derivationtime: {
            column: "coalesce(to_char(co.handoffdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS'),'')"
        },
        firstinteractiondate: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')) ELSE to_char((co.startdate + co.firstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY') END"
        },
        firstinteractiontime: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')) ELSE to_char((co.startdate + co.firstreplytime) + p_offset * INTERVAL '1hour' ::time, 'HH24:MI:SS') END"
        },
        tmo: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.realduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        tmg: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM CASE WHEN ou.type <> 'BOT' THEN (co.realduration - co.userfirstreplytime) ELSE null END)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        suspensiontime: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.totalpauseduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        avgagentresponse: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.useraveragereplytime)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        firstname: {
            column: "pe.firstname"
        },
        lastname: {
            column: "pe.lastname"
        },
        email: {
            column: "pe.email"
        },
        phone: {
            column: "pe.phone"
        },
        swingingtimes: {
            column: "co.balancetimes"
        },
        tmoagent: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.totalduration - co.firstassignedtime - co.botduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        holdingholdtime: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.holdingwaitingtime)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
    },
    userproductivityhours: {
        datehour: {
            column: "pr.datestr",
            type: "datestr"
        },
        agent: {
            column: "pr.fullname"
        },
        hoursrange: {
            column: "pr.hoursrange"
        },
        worktime: {
            column: "date_trunc('seconds', COALESCE(pr.worktime::text,'00:00:00'))"
        },
        busytimewithinwork: {
            column: "date_trunc('seconds', COALESCE(pr.busytimewithinwork::text,'00:00:00'))"
        },
        freetimewithinwork: {
            column: "date_trunc('seconds', COALESCE(pr.freetimewithinwork::text,'00:00:00'))"
        },
        busytimeoutsidework: {
            column: "date_trunc('seconds', COALESCE(pr.busytimeoutsidework::text,'00:00:00'))"
        },
        onlinetime: {
            column: "date_trunc('seconds', COALESCE(pr.onlinetime::text,'00:00:00'))"
        },
        idletime: {
            column: "date_trunc('seconds', COALESCE(pr.idletime::text,'00:00:00'))"
        },
        qtytickets: {
            column: "COALESCE(pr.qtytickets,0)"
        },
        qtyconnection: {
            column: "COALESCE(pr.qtyconnection,0)"
        },
        qtydisconnection: {
            column: "COALESCE(pr.qtydisconnection,0)"
        }
    },
    loginhistory: {
        datehour: {
            column: "uh.createdate",
            type: "date"
        },
        user: {
            column: "concat(u.firstname,' ',u.lastname)"
        },
        username: {
            column: "u.usr"
        },
        status: {
            column: "uh.status"
        },
        type: {
            column: "uh.type"
        },
    },
    ticket: {
        numeroticket: {
            column: "co.ticketnum"
        },
        fecha: {
            column: "co.startdate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        firstusergroup: {
            column: "do6.domaindesc"
        },
        ticketgroup: {
            column: "do5.domaindesc"
        },
        communicationchanneldescription: {
            column: "cc.description"
        },
        name: {
            column: "pe.name"
        },
        canalpersonareferencia: {
            column: "pcc.personcommunicationchannelowner"
        },
        fechainicio: {
            column: "co.startdate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        fechafin: {
            column: "co.finishdate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        fechaprimeraconversacion: {
            column: "co.firstconversationdate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        fechaultimaconversacion: {
            column: "co.lastconversationdate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        fechahandoff: {
            column: "co.handoffdate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        asesorinicial: {
            column: "(select concat(us.firstname,' ',us.lastname) from usr us where co.firstuserid = us.userid )"
        },
        asesorfinal: {
            column: "concat(us.firstname,' ',us.lastname)"
        },
        supervisor: {
            column: "concat(usr2.firstname,' ',usr2.lastname)"
        },
        empresa: {
            column: "case when us.firstname in ('Bot','HOLDING') then 'VCA Perú' else us.company end"
        },
        attentiongroup: {
            column: "COALESCE(NULLIF(ous.groups,''),'Sin grupo de atención')::character varying"
        },
        classification: {
            column: "co.classification"
        },
        tiempopromediorespuesta: {
            column: "co.averagereplytime::text",
            type: "time"
        },
        tiempoprimerarespuestaasesor: {
            column: "co.userfirstreplytime::text",
            type: "time"
        },
        tiempopromediorespuestaasesor: {
            column: "co.useraveragereplytime::text",
            type: "time"
        },
        tiempopromediorespuestapersona: {
            column: "co.personaveragereplytime::text",
            type: "time"
        },
        duraciontotal: {
            column: "co.totalduration::text",
            type: "time"
        },
        duracionreal: {
            column: "co.realduration::text",
            type: "time"
        },
        duracionpausa: {
            column: "co.totalpauseduration::text",
            type: "time"
        },
        tmoasesor: {
            column: "CASE WHEN co.status = 'CERRADO' THEN COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.totalduration - co.firstassignedtime - co.botduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') ELSE COALESCE(TO_CHAR((EXTRACT(EPOCH FROM (NOW() - co.startdate) - co.firstassignedtime - co.botduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') END",
            type: "time"
        },
        tiempoprimeraasignacion: {
            column: "co.firstassignedtime::text",
            type: "time"
        },
        estadoconversacion: {
            column: "co.status"
        },
        tipocierre: {
            column: "coalesce(do3.domaindesc,co.closetype,'Cierre automático')"
        },
        tipification: {
            column: "cla.description"
        },
        firstname: {
            column: "pe.firstname"
        },
        contact: {
            column: "pe.contact"
        },
        lastname: {
            column: "pe.lastname"
        },
        email: {
            column: "pe.email"
        },
        phone: {
            column: "pe.phone"
        },
        balancetimes: {
            column: "COALESCE(co.balancetimes,0)",
            type: "number"
        },
        documenttype: {
            column: "pe.documenttype"
        },
        dni: {
            column: "pe.documentnumber"
        },
        abandoned: {
            column: "CASE WHEN propaba.propertyvalue = 'SUNAT' THEN CASE WHEN (coalesce(co.abandoned, false) = true and coalesce(co.startdate + co.botduration + co.firstassignedtime > co.closetabdate, false)) THEN 'SI' ELSE 'NO' END ELSE CASE WHEN co.abandoned = true THEN 'SI' ELSE 'NO' END END"
        },
        enquiries: {
            column: "co.enquiries"
        },
        labels: {
            column: "COALESCE(co.tags, '')"
        },
        tdatime: {
            column: "co.tdatime::text",
            type: "time"
        },
        campaign: {
            column: "ca.title"
        }
    },
    person: {
        havelead: {
            column: "case when l.priority is not null then true else false end",
            type: "boolean"
        },
        datenote: {
            column: "CONCAT(lda.description, case when ldn.description <> '' then ldn.description else 'FILE' end)"
        },
        corpid: {
            column: "pe.corpid"
        },
        corpdesc: {
            column: "corp.description"
        },
        orgid: {
            column: "pe.orgid"
        },
        orgdesc: {
            column: "org.description"
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
            column: "pe.type"
        },
        name: {
            column: "CONCAT(pe.name, pe.email, pe.phone)"
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
            column: "pe.firstcontact + p_offset * interval '1hour'",
            type: "date"
        },
        lastcontact: {
            column: "pe.lastcontact + p_offset * interval '1hour'",
            type: "date"
        },
        lastcommunicationchannelid: {
            column: "pe.lastcommunicationchannelid"
        },
        communicationchannelname: {
            column: "cc.description"
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
            column: "pe.educationlevel"
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
        address: {
            column: "pe.address"
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
            column: "pe2.name"
        },
        displayname: {
            column: "pcc.displayname"
        },
        locked: {
            column: "pcc.locked"
        },
        lastuser: {
            column: "co.lastuser"
        },
        phasejson: {
            column: "(pl.phasejson->>'###JVALUE###')::BIGINT > 0",
            type: "json"
        }
    },
    blacklist: {
        phone: {
            column: "bl.phone"
        },
        description: {
            column: "bl.description"
        },
        createdate: {
            column: "bl.createdate + p_offset * interval '1hour'",
            type: "date"
        }
    },
    campaignreport: {
        campaignid: {
            column: "ch.campaignid"
        },
        templatetype: {
            column: "mt.type"
        },
        title: {
            column: "ca.title"
        },
        description: {
            column: "ca.description"
        },
        rundate: {
            column: "ch.rundate",
            type: "date"
        },
        channel: {
            column: "cc.description"
        },
        total: {
            column: "ch.total",
            type: "number"
        },
        success: {
            column: "ch.success",
            type: "number"
        },
        successp: {
            column: "ROUND(ch.success::numeric / ch.total * 100,2)",
            type: "number"
        },
        fail: {
            column: "ch.fail",
            type: "number"
        },
        failp: {
            column: "ROUND(ch.fail::numeric / ch.total * 100,2)",
            type: "number"
        },
        locked: {
            column: "ch.locked",
            type: "number"
        },
        blacklisted: {
            column: "ch.blacklisted",
            type: "number"
        },
        attended: {
            column: "ch.attended",
            type: "number"
        }
    },
    lead: {
        opportunity: {
            column: "ld.description"
        },
        changedate: {
            column: "ld.changedate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        contact_name: {
            column: "pcc.displayname"
        },
        email: {
            column: "ld.email"
        },
        phone: {
            column: "ld.phone"
        },
        priority: {
            column: "ld.priority"
        },
        name: {
            column: "CONCAT(usr.firstname,'' '',usr.lastname)"
        },
        phase: {
            column: "col.description"
        },
        status: {
            column: "ld.status"
        },
        tags: {
            column: "ld.tags"
        },
        notedate: {
            column: "ldn.changedate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        notedescription: {
            column: "ldn.description"
        },
        notemedia: {
            column: "ldn.media"
        },
        activitydate: {
            column: "lda.duedate",
            type: "date"
        },
        activitydescription: {
            column: "lda.description"
        },
        sales_person: {
            column: "ld.createby"
        },
        next_activity: {
            column: "lda.description"
        },
        expected_revenue: {
            column: "ld.expected_revenue",
            type: "number"
        },
        expected_closing: {
            column: "ld.date_deadline + p_offset * INTERVAL '1hour'",
            type: "date"
        },
    },
}