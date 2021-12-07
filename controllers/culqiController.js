const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const Culqi = require('culqi-node');
const culqi = new Culqi({
    privateKey: 'sk_test_A21tqesxbjbJmX9y',
    // publicKey: 'pk_test_wXgBHymgNU4CZknl'
});

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

const saveCustomer = async (corpid, orgid, id, customer) => {
    const query = "UPDATE billing SET customerjson = $customerjson WHERE corpid = $corpid AND orgid = $orgid AND billingid = $id"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, id: id, customerjson: customer }}).catch(err => getErrorSeq(err));
}

const saveCard = async (corpid, orgid, id, card) => {
    const query = "UPDATE billing SET cardjson = $cardjson WHERE corpid = $corpid AND orgid = $orgid AND billingid = $id"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, id: id, cardjson: card }}).catch(err => getErrorSeq(err));
}

const saveSubscription = async (corpid, orgid, id, subscription) => {
    const query = "UPDATE billing SET subscriptionjson = $subscriptionjson WHERE corpid = $corpid AND orgid = $orgid AND billingid = $id"
    await sequelize.query(query, { type: QueryTypes.SELECT, bind: { corpid: corpid, orgid: orgid, id: id, subscriptionjson: subscription }}).catch(err => getErrorSeq(err));
}

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

exports.createCharge = async (req, res) => {
    const { corpid, orgid, userid } = req.user;
    const { settings, token, metadata = {} } = req.body;
    try {
        const userprofile_q = 'SELECT firstname, lastname, email, phone, country FROM usr WHERE userid = $userid'
        const userprofile = await sequelize.query(userprofile_q, {type: QueryTypes.SELECT, bind: {userid}}).catch(err => getErrorSeq(err));

        if (userprofile.length > 0) {
            const charge = await culqi.charges.createCharge({
                amount: settings.amount,
                currency_code: settings.currency,
                email: token.email,
                source_id: token.id,
                capture: false,
                description: `Laraigo ${settings.description}`.slice(0,80),
                metadata: {
                    title: settings.title,
                    ...metadata,
                    corpid: corpid,
                    orgid: orgid,
                    userid: userid,
                },
                antifraud_details: {
                    first_name: userprofile[0].firstname,
                    last_name: userprofile[0].lastname,
                    address: userprofile[0].address || 'EMPTY',
                    address_city: userprofile[0].address_city || 'N/A',
                    country_code: userprofile[0].country || token.client.ip_country_code,
                    phone: userprofile[0].phone,
                }
            });
            console.log(charge);
    
            // Do some other operations, such as custom self-made fraud prevention
    
            const capturedCharge = await culqi.charges.captureCharge({
                // chr_test_xxxxxxxxxxxxxxxx
                id: charge.id,
            });
            console.log(capturedCharge);
    
            await saveCharge(1, token, charge);

            // Do some other operations, such save data of the charge
    
            if (capturedCharge.object === 'error') {
                return res.json({
                    error: false,
                    success: true,
                    data: {
                        object: capturedCharge.object,
                        id: capturedCharge.charge_id,
                        code: capturedCharge.code,
                        message: capturedCharge.user_message
                    }
                });
            }
            else {
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
            return res.status(404).json({
                error: true,
                success: false,
                code: '',
                message: 'user not found' ,
                data: {
                    object: 'error',
                    id: '',
                }
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "There was a problem, please try again later" });
    }
};

exports.createSubscription = async (req, res) => {
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

        const customers = await culqi.customers.getCustomers({
            email: token.email
        });
        let customer = {};
        if (customers.data.length > 0) {
            customer = customers.data[0];
        }
        else {
            const userprofile_q = 'SELECT firstname, lastname, email, phone, country FROM usr WHERE userid = $userid'
            const userprofile = await sequelize.query(userprofile_q, {type: QueryTypes.SELECT, bind: {userid}}).catch(err => getErrorSeq(err));
            
            customer = await culqi.customers.createCustomer({
                first_name: userprofile[0].firstname,
                last_name: userprofile[0].lastname,
                email: token.email,
                address: userprofile[0].address || 'EMPTY',
                address_city: userprofile[0].address_city || 'N/A',
                country_code: userprofile[0].country || token.client.ip_country_code,
                phone: userprofile[0].phone,
                metadata: {
                    title: settings.title,
                    ...metadata,
                    corpid: corpid,
                    orgid: orgid,
                    userid: userid,
                },
            });
        }
        await saveCustomer(corpid, orgid, 1, customer);
        console.log(customer);
        
        const card = await culqi.cards.createCard({
            customer_id: customer.id,
            token_id: token.id
        });
        await saveCard(corpid, orgid, 1, card);
        console.log(card);
                
        const subscription = await culqi.subscriptions.createSubscription({
            card_id: card.id,
            plan_id: plan.id
        });
        await saveSubscription(corpid, orgid, 1, subscription);
        console.log(subscription);

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

exports.deleteSubscription = async (req, res) => {
    const { id } = req.body;
    try {
        const subscription = await culqi.subscriptions.deleteSubscription({
            id: id
        });
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