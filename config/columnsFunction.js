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
            column: "to_char(inter.createdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY HH24:MI:SS')"
        },
        pregunta: {
            column: "inter.inputquestion"
        },
        respuesta: {
            column: "inter.interactiontext"
        },
        valido: {
            column: "CASE WHEN inter.validinput THEN 'SI' ELSE 'NO' END"
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
            column: "extract(year from (co.startdate + p_offset * INTERVAL '1hour'))::character varying"
        },
        mesticket: {
            column: "extract(month from (co.startdate + p_offset * INTERVAL '1hour'))::character varying"
        },
        fechaticket: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')::character varying"
        },
        horaticket: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')::character varying"
        },
        cliente: {
            column: "pe.name"
        },
        numerodocumento: {
            column: "pe.documentnumber"
        },
        asesor: {
            column: "concat(us.firstname,' ',us.lastname)::character varying"
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
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'YYYY-MM-DD')::character varying"
        },
        horafin: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')::character varying"
        },
        fechaprimerainteraccion: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'YYYY-MM-DD'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'YYYY-MM-DD')) ELSE null END ::character varying"
        },
        horaprimerainteraccion: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')) ELSE null END ::character varying"
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
    interaction: {
        numeroticket: {
            column: "co.ticketnum"
        },
        anioticket: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','YYYY')::character varying"
        },
        mesticket: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','MM')::character varying"
        },
        fechaticket: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','DD/MM/YYYY')::character varying"
        },
        horaticket: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour','HH24:MI:SS')::character varying"
        },
        linea: {
            column: "inter.interactionid"
        },
        fechalinea: {
            column: "to_char(inter.createdate + p_offset * INTERVAL '1hour','DD/MM/YYYY')::character varying"
        },
        horalinea: {
            column: "to_char(inter.createdate + p_offset * INTERVAL '1hour','HH24:MI:SS')::character varying"
        },
        cliente: {
            column: "pe.name"
        },
        canal: {
            column: "cc.description"
        },
        asesor: {
            column: "concat(us.firstname,' ',us.lastname)::character varying"
        },
        intencion: {
            column: "inter.intent"
        },
        tipotexto: {
            column: "inter.interactiontype"
        },
        texto: {
            column: "inter.interactiontext"
        },
        usergroup: {
            column: "co.usergroup"
        },
        displayname: {
            column: "pcc.displayname"
        },
        phone: {
            column: "pe.phone"
        }
    },
    productivity: {
        numeroticket: {
            column: "co.ticketnum"
        },
        anio: {
            column: "extract(year from co.startdate + p_offset * INTERVAL '1hour')::int"
        },
        mes: {
            column: "extract(month from co.startdate + p_offset * INTERVAL '1hour')::int"
        },
        semana: {
            column: "extract(week from co.startdate + p_offset * INTERVAL '1hour')::int"
        },
        dia: {
            column: "extract(day from co.startdate + p_offset * INTERVAL '1hour')::int"
        },
        hora: {
            column: "extract(hour from co.startdate + p_offset * INTERVAL '1hour')::int"
        },
        canal: {
            column: "cc.description"
        },
        cliente: {
            column: "pe.name"
        },
        cerradopor: {
            column: "ou.type"
        },
        asesor: {
            column: "concat(us.firstname,' ',us.lastname)::character varying"
        },
        tipocierre: {
            column: "coalesce(do2.domaindesc, co.closetype)"
        },
        fechainicio: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')::character varying"
        },
        horainicio: {
            column: "to_char(co.startdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')::character varying"
        },
        fechafin: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')::character varying"
        },
        horafin: {
            column: "to_char(co.finishdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')::character varying"
        },
        fechaderivacion: {
            column: "to_char(co.handoffdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')::character varying"
        },
        horaderivacion: {
            column: "coalesce(to_char(co.handoffdate + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS'),'')::character varying"
        },
        fechaprimerainteraccion: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')) ELSE to_char((co.startdate + co.firstreplytime) + p_offset * INTERVAL '1hour', 'DD/MM/YYYY') END ::character varying"
        },
        horaprimerainteraccion: {
            column: "CASE WHEN ou.type <> 'BOT' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS'), to_char((co.startdate + co.userfirstreplytime) + p_offset * INTERVAL '1hour' :: time, 'HH24:MI:SS')) ELSE to_char((co.startdate + co.firstreplytime) + p_offset * INTERVAL '1hour' ::time, 'HH24:MI:SS') END ::character varying"
        },
        tmo: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.realduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') :: character varying"
        },
        tmg: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM CASE WHEN ou.type <> 'BOT' THEN (co.realduration - co.userfirstreplytime) ELSE null END)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') :: character varying"
        },
        tiemposuspension: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.totalpauseduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') :: character varying"
        },
        tiempopromediorespuestaasesor: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.useraveragereplytime)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') :: character varying"
        },
        firstname: {
            column: "pe.firstname"
        },
        lastname: {
            column: "pe.lastname"
        },
        phone: {
            column: "pe.phone"
        },
        email: {
            column: "pe.email"
        },
        contact: {
            column: "pe.contact"
        },
        displayname: {
            column: "pcc.displayname"
        },
        holdingwaitingtime: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.holdingwaitingtime)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') :: character varying"
        },
        tmoasesor: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.totalduration - co.firstassignedtime - co.botduration)::text || ' seconds ')::interval,'HH24:MI:SS'),'00:00:00') :: character varying"
        }
    },
    userproductivityhours: {
        corpid: {
            column: "pr.corpid"
        },
        orgid: {
            column: "pr.orgid"
        },
        userid: {
            column: "pr.userid"
        },
        fullname: {
            column: "pr.fullname"
        },
        channels: {
            column: "pr.communicationchannel::text"
        },
        channelsdesc: {
            column: "pr.communicationchanneldesc"
        },
        datestr: {
            column: "TO_CHAR(pr.datestr::DATE,'dd/mm/yyyy')"
        },
        hours: {
            column: "pr.hours"
        },
        hoursrange: {
            column: "pr.hoursrange"
        },
        worktime: {
            column: "COALESCE(pr.worktime::text,'00:00:00')"
        },
        busytimewithinwork: {
            column: "COALESCE(pr.busytimewithinwork::text,'00:00:00')"
        },
        freetimewithinwork: {
            column: "COALESCE(pr.freetimewithinwork::text,'00:00:00')"
        },
        busytimeoutsidework: {
            column: "COALESCE(pr.busytimeoutsidework::text,'00:00:00')"
        },
        onlinetime: {
            column: "COALESCE(pr.onlinetime::text,'00:00:00')"
        },
        idletime: {
            column: "COALESCE(pr.idletime::text,'00:00:00')"
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
        nombre_usuario: {
            column: "concat(u.firstname,' ',u.lastname)"
        },
        usuario: {
            column: "u.usr"
        },
        createdate: {
            column: "to_char(uh.createdate + p_offset * INTERVAL '1hour', 'DD/MM/YYYY')::character varying"
        },
        createhour: {
            column: "to_char(uh.createdate + p_offset * INTERVAL '1hour', 'HH24:MI')::character varying"
        },
        type: {
            column: "uh.type"
        },
        status: {
            column: "uh.status"
        },
        motivetype: {
            column: "uh.motivetype"
        }
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
            column: "co.firstusergroup"
        },
        ticketgroup: {
            column: "co.usergroup"
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