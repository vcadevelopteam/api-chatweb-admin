const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { getErrorSeq } = require('../config/helpers');
const Culqi = require('culqi-node');
const culqi = new Culqi({
    privateKey: 'sk_test_A21tqesxbjbJmX9y',
    // publicKey: 'pk_test_wXgBHymgNU4CZknl'
});

exports.getToken = async (req, res) => {
    const { settings, token, metadata = {} } = req.body;
    try {
        const tk = await culqi.tokens.getToken({
            id: token.id, 
        });
        console.log(tk);
        return res.json({ error: false, success: true, data: tk });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "There was a problem, please try again later" });
    }
}

const getBilling = async (corpid, orgid, id) => {
    const query = "SELECT currency, amount, status FROM billing WHERE corpid = $corpid AND orgid = $orgid AND billingid = $id"
    const result = await sequelize.query(query, { type: QueryTypes.SELECT, bind: { userid }}).catch(err => getErrorSeq(err));
    if (result.length > 0) {
        return result[0]
    }
    else {
        return null
    }
}

const getUserProfile = async (userid) => {
    const query = "SELECT firstname, lastname, email, phone, country FROM usr WHERE userid = $userid"
    const result = await sequelize.query(query, { type: QueryTypes.SELECT, bind: { userid }}).catch(err => getErrorSeq(err));
    if (result.length > 0) {
        return result[0]
    }
    else {
        return null
    }
}
const createCharge = async (settings, token, metadata, userprofile) => {
    return await culqi.charges.createCharge({
        amount: settings.amount,
        currency_code: settings.currency,
        email: token.email,
        source_id: token.id,
        capture: false,
        description: `Laraigo ${settings.description}`.slice(0,80),
        metadata: metadata,
        antifraud_details: {
            first_name: userprofile.firstname,
            last_name: userprofile.lastname,
            address: userprofile.address || 'EMPTY',
            address_city: userprofile.address_city || 'N/A',
            country_code: userprofile.country || token.client.ip_country_code,
            phone: userprofile.phone,
        }
    });
}

const saveCharge = async (corpid, orgid, id, token, charge) => {
    const query = `
        UPDATE billing
        SET status = 'PAGADO',
        pocketbook = 'CULQI',
        paymentdate = NOW(),
        email = $email,
        tokenid = $tokenid,
        capture = $capture,
        tokenjson = $tokenjson,
        chargejson = $chargejson
        WHERE corpid = $corpid
        AND orgid = $orgid
        AND billingid = $id
    `
    await sequelize.query(query, {
        type: QueryTypes.SELECT,
        bind: {
            corpid: corpid,
            orgid: orgid,
            id: id,
            email: token.email,
            tokenid: token.id,
            capture: true,
            tokenjson: token,
            chargejson: charge,
        }}).catch(err => getErrorSeq(err));
}

exports.charge = async (req, res) => {
    const { corpid, orgid, userid } = req.user;
    const { id, settings, token, metadata = {} } = req.body;
    try {
        const billing = await getBilling(corpid, orgid, id);
        if (billing) {
            if (billing.status === 'PENDIENTE') {
                if (billing.currency === settings.currency && billing.amount * 100 === settings.amount) {
                    const userprofile = await getUserProfile(userid);
                    if (userprofile) {
                        metadata.corpid = corpid;
                        metadata.orgid = orgid;
                        metadata.userid = userid;
                        const charge = await createCharge(settings, token, metadata, userprofile)
                        console.log(charge);
                        const capturedCharge = await culqi.charges.captureCharge({ id: charge.id, });
                        console.log(capturedCharge);
                        if (capturedCharge.object === 'error') {
                            return res.status(400).json({
                                error: true,
                                success: false,
                                data: {
                                    object: capturedCharge.object,
                                    id: capturedCharge.charge_id,
                                    code: capturedCharge.code,
                                    message: capturedCharge.user_message
                                }
                            });
                        }
                        else {
                            await saveCharge(corpid, orgid, id, token, charge);
                            return res.json({
                                error: false,
                                success: true,
                                code: capturedCharge.outcome.code,
                                message: capturedCharge.outcome.user_message ,
                                data: {
                                    object: capturedCharge.object,
                                    id: capturedCharge.id,
                                }
                            });
                        }
                    }
                    else {
                        return res.status(403).json({ error: true, success: false, code: '', message: 'invalid user' });
                    }
                }
                else {
                    return res.status(403).json({ error: true, success: false, code: '', message: 'invalid bill data' });
                }
            }
            else {
                return res.json({ error: false, success: true, code: '', message: 'bill already paid' });
            }
        }
        else {
            return res.status(404).json({ error: true, success: false, code: '', message: 'bill not found' });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "There was a problem, please try again later" });
    }
};

const createCustomer = async (token, metadata, userprofile) => {
    return await culqi.customers.createCustomer({
        first_name: userprofile.firstname,
        last_name: userprofile.lastname,
        email: token.email,
        address: userprofile.address || 'EMPTY',
        address_city: userprofile.address_city || 'N/A',
        country_code: userprofile.country || token.client.ip_country_code,
        phone: userprofile.phone,
        metadata: metadata,
    });
}

const saveCustomer = async (corpid, orgid, customer) => {
    const query = "UPDATE org SET customerjson = $customerjson WHERE corpid = $corpid AND orgid = $orgid"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, customerjson: customer }}).catch(err => getErrorSeq(err));
}

const saveCard = async (corpid, orgid, card) => {
    const query = "UPDATE org SET cardjson = $cardjson WHERE corpid = $corpid AND orgid = $orgid"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, cardjson: card }}).catch(err => getErrorSeq(err));
}

const saveSubscription = async (corpid, orgid, id, subscription) => {
    const query = "UPDATE billing SET subscriptionjson = $subscriptionjson WHERE corpid = $corpid AND orgid = $orgid AND billingid = $id"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, id: id, subscriptionjson: subscription }}).catch(err => getErrorSeq(err));
}

exports.subscribe = async (req, res) => {
    const { corpid, orgid, userid } = req.user;
    const { settings, token, metadata } = req.body;
    try {
        let plan = {}
        if (!settings.planid) {
            plan = await culqi.plans.createPlan({
                name: settings.title,
                amount: settings.amount,
                currency_code: settings.currency,
                interval: settings.interval || 'meses',
                interval_count: settings.interval_count || 1,
                limit: settings.limit || 12,
                metadata: {
                    title: settings.title,
                    ...metadata,
                    corpid: corpid,
                    orgid: orgid,
                    userid: userid,
                },
            });
            console.log(plan);
        }
        else {
            plan.id = settings.planid
        }

        const customers = await culqi.customers.getCustomers({ email: token.email });
        let customer = {};
        if (customers.data.length > 0) {
            customer = customers.data[0];
        }
        else {
            const userprofile = await getUserProfile(userid);
            if (userprofile) {
                customer = createCustomer(token, metadata, userprofile);
            }
            else {
                return res.status(403).json({ error: true, success: false, code: '', message: 'invalid user' });
            }
        }
        console.log(customer);
        await saveCustomer(corpid, orgid, customer);
        
        const card = await culqi.cards.createCard({
            customer_id: customer.id,
            token_id: token.id
        });
        console.log(card);
        await saveCard(corpid, orgid, card);
                
        const subscription = await culqi.subscriptions.createSubscription({
            card_id: card.id,
            plan_id: plan.id
        });
        console.log(subscription);
        await saveSubscription(corpid, orgid, 1, subscription);

        // Do some other operations, such save data of the subscription

        return res.json({
            error: false,
            success: true,
            code: subscription.charges[0].outcome.code,
            message: subscription.charges[0].outcome.user_message,
            data: {
                object: subscription.object,
                id: subscription.id,
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "There was a problem, please try again later"});
    }
};

exports.unsubscribe = async (req, res) => {
    const { id } = req.body;
    try {
        const subscription = await culqi.subscriptions.deleteSubscription({ id: id });
        console.log(subscription);

        // Do some other operations, such save data of the subscription

        return res.json({
            error: false,
            success: true,
            code: '',
            message: subscription.merchant_message,
            data: {
                object: 'subscription',
                id: subscription.id,
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "There was a problem, please try again later" });
    }
}