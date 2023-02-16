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
        enddate: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')"
        },
        endtime: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')"
        },
        firstinteractiondate: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')) ELSE to_char((co.startdate + co.firstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY') END"
        },
        firstinteractiontime: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')) ELSE to_char((co.startdate + co.firstreplytime) + p_offset * INTERVAL '1hour' ::time, 'HH24:MI:SS') END"
        },
        person: {
            column: "pcc.displayname"
        },
        phone: {
            column: "pe.phone"
        },
        closedby: {
            column: "ou.type"
        },
        agent: {
            column: "nullif(concat(us.firstname,' ',us.lastname), ' '), ' ')"
        },
        closetype: {
            column: "coalesce(do2.domaindesc, co.closetype)"
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
            column: "nullif(concat(us.firstname,' ',us.lastname), ' ')"
        },
        intent: {
            column: "inter.intent"
        },
        ticketgroup: {
            column: "dogr.domaindesc"
        },
        email: {
            column: "pe.email"
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
        origin: {
            column: "co.origin"
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
            column: "nullif(concat(us.firstname,' ',us.lastname), ' ')"
        },
        ticketgroup: {
            column: "co.usergroup"
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
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM GREATEST('00:00:00'::INTERVAL, co.totalduration - co.pausedurationafteruser - co.firstassignedtime - co.botduration))::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        tmeagent: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM CASE WHEN ou.type = 'ASESOR' THEN co.userfirstreplytime ELSE co.firstreplytime END)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        holdingholdtime: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.holdingwaitingtime)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00')"
        },
        tags: {
            column: "COALESCE(co.tags, '')"
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
            column: "date_trunc('seconds', COALESCE(pr.worktime,'00:00:00'))"
        },
        busytimewithinwork: {
            column: "date_trunc('seconds', COALESCE(pr.busytimewithinwork,'00:00:00'))"
        },
        freetimewithinwork: {
            column: "date_trunc('seconds', COALESCE(pr.freetimewithinwork,'00:00:00'))"
        },
        busytimeoutsidework: {
            column: "date_trunc('seconds', COALESCE(pr.busytimeoutsidework,'00:00:00'))"
        },
        onlinetime: {
            column: "date_trunc('seconds', COALESCE(pr.onlinetime,'00:00:00'))"
        },
        idletime: {
            column: "date_trunc('seconds', COALESCE(pr.idletime,'00:00:00'))"
        },
        availabletime: {
            column: "date_trunc('seconds', GREATEST('00:00:00'::INTERVAL, COALESCE(pr.onlinetime - pr.busytimewithinwork,'00:00:00')))"
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
            column: "nullif(concat(u.firstname,' ',u.lastname), ' ')"
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
        origin: {
            column: "co.origin"
        },
        firstusergroup: {
            column: "co.firstusergroup"
        },
        ticketgroup: {
            column: "co.usergroup"
        },
        rolasesor: {
            column: "r.description"
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
            column: "(select nullif(concat(us.firstname,' ',us.lastname), ' ') from usr us where co.firstuserid = us.userid )"
        },
        asesorfinal: {
            column: "nullif(concat(us.firstname,' ',us.lastname), ' ')"
        },
        supervisor: {
            column: "nullif(concat(usr2.firstname,' ',usr2.lastname), ' ')"
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
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM (CASE WHEN co.status = 'CERRADO' THEN co.totalduration ELSE NOW() - co.startdate END))::text || ' seconds ')::interval, 'HH24:MI:SS'),'00:00:00')",
            type: "time"
        },
        duracionreal: {
            column: "COALESCE(TO_CHAR(date_trunc('seconds', (EXTRACT(EPOCH FROM (CASE WHEN co.status = 'CERRADO' THEN co.realduration ELSE CASE WHEN cc.type IN ('VOXI') THEN NOW() - co.callanswereddate ELSE NOW() - co.startdate - co.totalpauseduration END END))::text || ' seconds ')::interval),'HH24:MI:SS'), '00:00:00')",
            type: "time"
        },
        duracionpausa: {
            column: "co.totalpauseduration::text",
            type: "time"
        },
        tmoasesor: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM (CASE WHEN co.status = 'CERRADO' THEN GREATEST('00:00:00'::INTERVAL, co.totalduration - co.pausedurationafteruser - co.firstassignedtime - co.botduration) ELSE GREATEST('00:00:00'::INTERVAL, NOW() - co.startdate - co.pausedurationafteruser - co.firstassignedtime - co.botduration) END))::text || ' seconds ')::interval, 'HH24:MI:SS'), '00:00:00')",
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
            column: "CASE WHEN propaba.propertyvalue = 'SUNAT' THEN CASE WHEN (coalesce(co.abandoned, false) = true and coalesce(co.startdate + co.botduration + co.firstassignedtime > co.closetabdate, false)) THEN 'SI' ELSE 'NO' END WHEN propaba.propertyvalue = 'CLARO' THEN CASE WHEN co.firstassignedtime IS NULL AND co.handoffdate IS NOT NULL THEN 'SI' ELSE 'NO' END ELSE CASE WHEN co.abandoned = true THEN 'SI' ELSE 'NO' END END"
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
        holdingwaitingtime: {
            column: "co.holdingwaitingtime::text",
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
            column: "CONCAT(pe.name, pe.email, pe.phone)",
            advance_search: true
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
        },
        healthprofessional: {
            column: "pe.healthprofessional"
        },
        referralchannel: {
            column: "pe.referralchannel"
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
    campaignperson: {
        firstname: {
            column: "pe.firstname"
        },
        lastname: {
            column: "pe.lastname"
        },
        documenttype: {
            column: "pe.documenttype"
        },
        documentnumber: {
            column: "pe.documentnumber"
        },
        persontype: {
            column: "pe.persontype"
        },
        type: {
            column: "pe.type"
        },
        phone: {
            column: "pe.phone"
        },
        alternativephone: {
            column: "pe.alternativephone"
        },
        email: {
            column: "pe.email"
        },
        alternativeemail: {
            column: "pe.alternativeemail"
        },
        lastcontact: {
            column: "pe.lastcontact",
            type: "date"
        },
        agent: {
            column: "co.agent"
        },
        opportunity: {
            column: "ld.description"
        },
        birthday: {
            column: "pe.birthday",
            type: "datestr"
        },
        gender: {
            column: "domgen.domaindesc"
        },
        educationlevel: {
            column: "domedu.domaindesc"
        },
        comments: {
            column: "ldn.description"
        },
        address: {
            column: "pe.address"
        },
        addressreference: {
            column: "pe.addressreference"
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
    },
    campaignleadperson: {
        opportunity: {
            column: "ld.description"
        },
        changedate: {
            column: "ld.changedate",
            type: "date"
        },
        name: {
            column: "TRIM(CONCAT(pe.firstname,' ',pe.lastname))"
        },
        email: {
            column: "ld.email"
        },
        phone: {
            column: "ld.phone"
        },
        expected_revenue: {
            column: "ld.expected_revenue"
        },
        date_deadline: {
            column: "ld.date_deadline",
            type: "date"
        },
        tags: {
            column: "ld.tags"
        },
        agent: {
            column: "CONCAT(usr.firstname,' ',usr.lastname)"
        },
        priority: {
            column: "ld.priority"
        },
        campaign: {
            column: "ca.title"
        },
        products: {
            column: "pc.title"
        },
        phase: {
            column: "col.description"
        },
        comments: {
            column: "ldn.description"
        },
    },
    campaignreport: {
        campaignid: {
            column: "ch.campaignid"
        },
        templatetype: {
            column: "mt.type"
        },
        templatename: {
            column: "ca.messagetemplatename"
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
            column: "nullif(CONCAT(usr.firstname,' ',usr.lastname), ' ')"
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
    survey: {
        ticketnum: {
            column: "co.ticketnum"
        },
        ticketdate: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','DD/MM/YYYY')"
        },
        tickettime: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','HH24:MI:SS')"
        },
        classification: {
            column: "COALESCE(co.classification, 'NINGUNO')"
        },
        supervisor: {
            column: "CONCAT(usr2.firstname, ' ', usr2.lastname) as supervisordesc"
        },
        agent: {
            column: "CONCAT(usr.firstname, ' ', usr.lastname)"
        },
        firstgroup: {
            column: "COALESCE(domi.domaindesc, 'NINGUNO')"
        },
        lastgroup: {
            column: "COALESCE(dom.domaindesc, 'NINGUNO')"
        },
        answer1: {
            column: "sa.answer1"
        },
        comment1: {
            column: "CASE WHEN sa.comment1 <> '' THEN sa.comment1 ELSE '-' END"
        },
        answer2: {
            column: "sa.answer2"
        },
        comment2: {
            column: "CASE WHEN sa.comment2 <> '' THEN sa.comment2 ELSE '-' END"
        },
        answer3: {
            column: "sa.answer3"
        },
        comment3: {
            column: "CASE WHEN sa.comment3 <> '' THEN sa.comment3 ELSE '-' END"
        },
    },
    ticketvsadviser: {
        numeroticket: {
            column: "co.ticketnum"
        },
        fechainicio: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')"
        },
        horainicio: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour', 'HH24:MI:SS')"
        },
        asesorid: {
            column: "co.lastuserid"
        },
        asesor: {
            column: "CONCAT(usr.firstname, ' ', usr.lastname)"
        },
        canalid: {
            column: "co.communicationchannelid"
        },
        canal: {
            column: "cc.description"
        },
        tipo: {
            column: "cla2.description"
        },
        submotivo: {
            column: "cla1.description"
        },
        valoracion: {
            column: "cla.description"
        },
        cerradopor: {
            column: "ous.type"
        },
        tipocierre: {
            column: "coalesce(do2.domaindesc, co.closetype)"
        },
        tipo_operacion: {
            column: "co.variablecontextsimple->>'operacion'"
        },
        operador: {
            column: "co.variablecontextsimple->>'nomoperador'"
        },
        plan: {
            column: "co.variablecontextsimple->>'tipoplandest'"
        },
        modalidad_compra: {
            column: "co.variablecontextsimple->>'var_compra_productos'"
        },
        provincia: {
            column: "co.variablecontextsimple->>'province'"
        },
        distrito: {
            column: "co.variablecontextsimple->>'district'"
        },
        telefono: {
            column: "co.variablecontextsimple->>'alternativephone'"
        },
        documento: {
            column: "co.variablecontextsimple->>'documentnumber'"
        },
        fechaprimerarespuesta: {
            column: "CASE WHEN co.userfirstreplytime = '00:00:00' THEN null ELSE to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY') END",
        },
        horaprimerarespuesta: {
            column: "CASE WHEN co.userfirstreplytime = '00:00:00' THEN null ELSE to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'HH24:MI:SS') END",
        },
        fechaultimarespuesta: {
            column: "to_char(co.lastreplydate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')",
        },
        horaultimarespuesta: {
            column: "to_char(co.lastreplydate + p_offset * INTERVAL '1hour', 'HH24:MI:SS')",
        },
        fechacierre: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')",
        },
        horacierre: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'HH24:MI:SS')",
        },
    },
    voicecall: {
        ticketdate: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','DD/MM/YYYY')"
        },
        tickettime: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','HH24:MI:SS')"
        },
        agent: {
            column: "CONCAT(usr.firstname, ' ', usr.lastname)"
        },
        phone: {
            column: "pcc.personcommunicationchannelowner"
        },
        name: {
            column: "pe.name"
        },
        origin: {
            column: "co.origin"
        },
        closetype: {
            column: "CASE WHEN co.closetype IN ('DESCONECTADO POR ASESOR', 'DESCONECTADO POR CLIENTE') THEN 'HANDLED' WHEN co.closetype IN ('LLAMADA NO CONTESTADA') THEN 'ABANDON' WHEN co.closetype IN ('LLAMADA FALLIDA', 'NO HAY ASESORES') THEN 'LOST' ELSE co.closetype END"
        },
    },
    location: {
        name: {
            column: "lc.name"
        },
        address: {
            column: "lc.address"
        },
        district: {
            column: "lc.district"
        },
        city: {
            column: "lc.city"
        },
        country: {
            column: "lc.country"
        },
        schedule: {
            column: "lc.schedule"
        },
        phone: {
            column: "lc.phone"
        },
        alternativephone: {
            column: "lc.alternativephone"
        },
        latitude: {
            column: "lc.latitude"
        },
        longitude: {
            column: "lc.longitude"
        },
        googleurl: {
            column: "lc.googleurl"
        },
        description: {
            column: "lc.description"
        },
        type: {
            column: "lc.type"
        },
    },
    uniquecontacts: {
        name: {
            column: "pe.name"
        },
        channels: {
            column: "cc.description"
        },
        firstcontact: {
            column: "pe.firstcontact + p_offset * INTERVAL '1HOUR'",
            type: "date"
        },
        lastcontact: {
            column: "pe.lastcontact + p_offset * INTERVAL '1HOUR'",
            type: "date"
        },
        phone: {
            column: "pe.phone"
        },
        email: {
            column: "pe.email"
        },
        status: {
            column: "pe.status"
        },
    },
    uniquecontactsconversation: {
        ticketnum: {
            column: "co.ticketnum"
        },

        startdate: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour', 'YYYY-MM-DD')"
        },
        starttime: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour', 'HH24:MI:SS')"
        },
        finishdate: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'YYYY-MM-DD')"
        },
        finishtime: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'HH24:MI:SS')"
        },
        channel: {
            column: "cc.description"
        },
        origin: {
            column: "co.origin"
        },
        name: {
            column: "pe.name"
        },
        email: {
            column: "pe.email"
        },
        phone: {
            column: "pe.phone"
        },
        closetype: {
            column: "coalesce(dom_cierre.domaindesc, co.closetype, 'Cierre automático')"
        },
        asesor: {
            column: "concat(usr.firstname, ' ', usr.lastname)"
        },
        usergroup: {
            column: "co.usergroup"
        },
        usertype: {
            column: "ous.type"
        },
        handoffdate: {
            column: "to_char(co.handoffdate + p_offset * INTERVAL '1HOUR', 'YYYY-MM-DD')"
        },
        handoofftime: {
            column: "to_char(co.handoffdate + p_offset * INTERVAL '1HOUR', 'HH24:MI:SS')"
        },
        tmo: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM (CASE WHEN co.status = 'CERRADO' THEN co.totalduration ELSE NOW() - co.startdate END))::text || ' seconds ')::interval, 'HH24:MI:SS'),'00:00:00')"
        },
        tmeasesor: {
            column: "date_trunc('seconds', co.userfirstreplytime)::text"
        },
        pauseduration: {
            column: "date_trunc('seconds',co.totalpauseduration)::text"
        },
        tdatime: {
            column: "date_trunc('seconds',co.tdatime)::text"
        },
        tmrasesor: {
            column: "date_trunc('seconds',co.useraveragereplytime)::text"
        },
        balancetimes: {
            column: "COALESCE(co.balancetimes,0)"
        },
        tmoasesor: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM (CASE WHEN co.status = 'CERRADO' THEN NULLIF(GREATEST('00:00:00'::INTERVAL, co.totalduration - co.pausedurationafteruser - co.firstassignedtime - co.botduration),'00:00:00') ELSE GREATEST('00:00:00'::INTERVAL, NOW() - co.startdate - co.pausedurationafteruser - co.firstassignedtime - co.botduration) END))::text || ' seconds ')::interval, 'HH24:MI:SS'), '00:00:00')"
        },
    },
    productcatalog: {
        catalogname: {
            column: "mc.catalogname"
        },
        catalogid: {
            column: "mc.catalogid"
        },
        corpid: {
            column: "p.corpid",
            type: "number"
        },
        orgid: {
            column: "p.orgid",
            type: "number"
        },
        metacatalogid: {
            column: "p.metacatalogid",
            type: "number"
        },
        productcatalogid: {
            column: "p.productcatalogid",
            type: "number"
        },
        productid: {
            column: "p.productid"
        },
        retailerid: {
            column: "p.retailerid"
        },
        title: {
            column: "p.title"
        },
        description: {
            column: "p.description"
        },
        descriptionshort: {
            column: "p.descriptionshort"
        },
        availability: {
            column: "p.availability"
        },
        category: {
            column: "p.category"
        },
        condition: {
            column: "p.condition"
        },
        currency: {
            column: "p.currency"
        },
        price: {
            column: "p.price",
            type: "number"
        },
        saleprice: {
            column: "p.saleprice",
            type: "number"
        },
        link: {
            column: "p.link"
        },
        imagelink: {
            column: "p.imagelink"
        },
        additionalimagelink: {
            column: "p.additionalimagelink"
        },
        brand: {
            column: "p.brand"
        },
        color: {
            column: "p.color"
        },
        gender: {
            column: "p.gender"
        },
        material: {
            column: "p.material"
        },
        pattern: {
            column: "p.pattern"
        },
        size: {
            column: "p.size"
        },
        datestart: {
            column: "to_char(p.datestart + p_offset * INTERVAL '1hour', 'YYYY-MM-DD')"
        },
        datelaunch: {
            column: "to_char(p.datelaunch + p_offset * INTERVAL '1hour', 'YYYY-MM-DD')"
        },
        dateexpiration: {
            column: "to_char(p.dateexpiration + p_offset * INTERVAL '1hour', 'YYYY-MM-DD')"
        },
        labels: {
            column: "p.labels"
        },
        customlabel0: {
            column: "p.customlabel0"
        },
        customlabel1: {
            column: "p.customlabel1"
        },
        customlabel2: {
            column: "p.customlabel2"
        },
        customlabel3: {
            column: "p.customlabel3"
        },
        customlabel4: {
            column: "p.customlabel4"
        },
        reviewstatus: {
            column: "p.reviewstatus"
        },
        reviewdescription: {
            column: "p.reviewdescription"
        },
        status: {
            column: "p.status"
        },
        type: {
            column: "p.type"
        },
    },
    reportvoicecall: {
        ticketnum: {
            column: "co.ticketnum"
        },
        channel: {
            column: "cc.description"
        },
        ticketdate: {
            column: "co.startdate + p_offset * INTERVAL '1hour'",
            type: "date"
        },
        tickettime: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','HH24:MI:SS')"
        },
        finishtime: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour','HH24:MI:SS')"
        },
        handoffdate: {
            column: "to_char(co.handoffdate + p_offset * INTERVAL '1hour','HH24:MI:SS')"
        },
        agent: {
            column: "CONCAT(usr.firstname, ' ', usr.lastname)"
        },
        name: {
            column: "pe.name"
        },
        phone: {
            column: "pcc.personcommunicationchannelowner"
        },
        origin: {
            column: "co.origin"
        },
        closetype: {
            column: "CASE WHEN co.closetype IN ('DESCONECTADO POR ASESOR', 'DESCONECTADO POR CLIENTE') THEN 'HANDLED' WHEN co.closetype IN ('LLAMADA NO CONTESTADA') THEN 'ABANDON' WHEN co.closetype IN ('LLAMADA FALLIDA', 'NO HAY ASESORES') THEN 'LOST' ELSE co.closetype END"
        },
        classification: {
            column: "cla.description"
        },
        totalduration: {
            column: "date_trunc('seconds', co.totalduration)::text"
        },
        agentduration: {
            column: "date_trunc('seconds', co.realduration - co.botduration)::text"
        },
        customerwaitingduration: {
            column: "date_trunc('seconds', co.callanswereddate - co.startdate + co.transferduration)::text"
        },
        holdingtime: {
            column: "date_trunc('seconds', co.callholdtime)::text"
        },
        transferduration: {
            column: "date_trunc('seconds', co.transferduration)::text"
        },
    }
}