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
    interaction: {
        numeroticket: {
            column: "rbi.ticketnum"
        },
        anioticket: {
            column: "rbi.yearconversation::character varying"
        },
        mesticket: {
            column: "rbi.monthconversation::character varying"
        },
        fechaticket: {
            column: "to_char(rbi.datestrconversation::date, ''DD/MM/YYYY'')::character varying"
        },
        horaticket: {
            column: "rbi.hourstrconversation::character varying"
        },
        linea: {
            column: "rbi.interactionid"
        },
        fechalinea: {
            column: "to_char(rbi.datestrinteraction::date, ''DD/MM/YYYY'')::character varying"
        },
        horalinea: {
            column: "rbi.hourstrinteraction::character varying"
        },
        cliente: {
            column: "rbi.personname"
        },
        canal: {
            column: "rbi.communicationchanneldesc"
        },
        asesor: {
            column: "rbi.username::character varying"
        },
        intencion: {
            column: "rbi.intent"
        },
        tipotexto: {
            column: "rbi.interactiontype"
        },
        texto: {
            column: "rbi.interactiontext"
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
            column: "extract(year from co.startdate - interval ''5 hour'')::int"
        },
        mes: {
            column: "extract(month from co.startdate - interval ''5 hour'')::int"
        },
        semana: {
            column: "extract(week from co.startdate - interval ''5 hour'')::int"
        },
        dia: {
            column: "extract(day from co.startdate - interval ''5 hour'')::int"
        },
        hora: {
            column: "extract(hour from co.startdate - interval ''5 hour'')::int"
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
            column: "concat(us.firstname,'' '',us.lastname)::character varying"
        },
        tipocierre: {
            column: "coalesce(do2.domaindesc, co.closetype)"
        },
        fechainicio: {
            column: "to_char(co.startdate - interval ''5 hour'', ''DD/MM/YYYY'')::character varying"
        },
        horainicio: {
            column: "to_char(co.startdate - interval ''5 hour'' :: time, ''HH24:MI:SS'')::character varying"
        },
        fechafin: {
            column: "to_char(co.finishdate - interval ''5 hour'', ''DD/MM/YYYY'')::character varying"
        },
        horafin: {
            column: "to_char(co.finishdate - interval ''5 hour'' :: time, ''HH24:MI:SS'')::character varying"
        },
        fechaderivacion: {
            column: "to_char(co.handoffdate - interval ''5 hour'', ''DD/MM/YYYY'')::character varying"
        },
        horaderivacion: {
            column: "coalesce(to_char(co.handoffdate - interval ''5 hour'' :: time, ''HH24:MI:SS''),'''')::character varying"
        },        
        fechaprimerainteraccion: {
            column: "CASE WHEN ou.type <> ''BOT'' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) - interval ''5 hour'', ''DD/MM/YYYY''), to_char((co.startdate + co.userfirstreplytime) - interval ''5 hour'', ''DD/MM/YYYY'')) ELSE to_char((co.startdate + co.firstreplytime) - interval ''5 hour'', ''DD/MM/YYYY'') END ::character varying"
        },
        horaprimerainteraccion: {
            column: "CASE WHEN ou.type <> ''BOT'' THEN coalesce(to_char((co.handoffdate + co.userfirstreplytime) - interval ''5 hour'' :: time, ''HH24:MI:SS''), to_char((co.startdate + co.userfirstreplytime) - interval ''5 hour'' :: time, ''HH24:MI:SS'')) ELSE to_char((co.startdate + co.firstreplytime) - interval ''5 hour'' ::time, ''HH24:MI:SS'') END ::character varying"
        },
        tmo: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.realduration)::text || '' seconds '')::interval,''HH24:MI:SS''),''00:00:00'') :: character varying"
        },
        tmg: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM CASE WHEN ou.type <> ''BOT'' THEN (co.realduration - co.userfirstreplytime) ELSE null END)::text || '' seconds '')::interval,''HH24:MI:SS''),''00:00:00'') :: character varying"
        },
        tiemposuspension: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.totalpauseduration)::text || '' seconds '')::interval,''HH24:MI:SS''),''00:00:00'') :: character varying"
        },
        tiempopromediorespuestaasesor: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.useraveragereplytime)::text || '' seconds '')::interval,''HH24:MI:SS''),''00:00:00'') :: character varying"
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
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.holdingwaitingtime)::text || '' seconds '')::interval,''HH24:MI:SS''),''00:00:00'') :: character varying"
        },
        tmoasesor: {
            column: "COALESCE(TO_CHAR((EXTRACT(EPOCH FROM co.totalduration - co.firstassignedtime - co.botduration)::text || '' seconds '')::interval,''HH24:MI:SS''),''00:00:00'') :: character varying"
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
            column: "TO_CHAR(pr.datestr::DATE,''dd/mm/yyyy'')"
        },
        hours: {
            column: "pr.hours"
        },
        hoursrange: {
            column: "pr.hoursrange"
        },
        worktime: {
            column: "COALESCE(pr.worktime::text,''00:00:00'')"
        },
        busytimewithinwork: {
            column: "COALESCE(pr.busytimewithinwork::text,''00:00:00'')"
        },
        freetimewithinwork: {
            column: "COALESCE(pr.freetimewithinwork::text,''00:00:00'')"
        },
        busytimeoutsidework: {
            column: "COALESCE(pr.busytimeoutsidework::text,''00:00:00'')"
        },
        onlinetime: {
            column: "COALESCE(pr.onlinetime::text,''00:00:00'')"
        },
        idletime: {
            column: "COALESCE(pr.idletime::text,''00:00:00'')"
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
            column: "concat(u.firstname,'' '',u.lastname)"
        },
        usuario: {
            column: "u.usr"
        },
        createdate: {
            column: "to_char(uh.createdate - interval ''5 hour'', ''DD/MM/YYYY'')::character varying"
        },
        createhour: {
            column: "to_char(uh.createdate - interval ''5 hour'', ''HH24:MI'')::character varying"
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