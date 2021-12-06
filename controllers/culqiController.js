// publicKey: 'pk_test_wXgBHymgNU4CZknl'
const Culqi = require('culqi-node');
const culqi = new Culqi({
    privateKey: 'sk_test_A21tqesxbjbJmX9y',
});

exports.getToken = async (req, res) => {
    const { publickey, settings, options, token, metadata } = req.body;
    try {
        const tk = await culqi.tokens.getToken({
            id: token.id, 
        });
        console.log(tk);
        return res.json({ error: false, success: true, data: tk });
    } catch (error) {
        return res.status(400).json({ error: true, success: false, data: error });
    }
}

exports.createCharge = async (req, res) => {
    const { publickey, settings, options, token, metadata } = req.body;
    try {
        const charge = await culqi.charges.createCharge({
            amount: settings.amount,
            currency_code: settings.currency,
            email: token.email,
            source_id: token.id,
            capture: false,
            description: settings.description.slice(0,80),
            metadata: {
                title: settings.title,
                browser: token.client.browser,
                ip: token.client.ip,
                ip_country: token.client.ip_country_code,
                card_brand: token.iin.card_brand,
                card_country: token.iin.issuer.country_code,
                ...metadata
            },
            // antifraud_details: {
            //     first_name: '',
            //     last_name: '',
            //     address: '',
            //     address_city: '',
            //     country_code: '',
            //     phone: ''
            // }
        });
        console.log(charge);

        // Do some other operations, such as custom self-made fraud prevention

        const capturedCharge = await culqi.charges.captureCharge({
            // chr_test_xxxxxxxxxxxxxxxx
            id: charge.id,
        });
        console.log(capturedCharge);

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
                data: {
                    object: capturedCharge.object,
                    id: capturedCharge.id,
                    code: capturedCharge.outcome.code,
                    message: capturedCharge.outcome.user_message 
                }
            });
        }
    } catch (error) {
        return res.status(400).json({ error: true, success: false, data: error });
    }
};

exports.createSubscription = async (req, res) => {
    const { publickey, settings, options, token, metadata } = req.body;
    try {
        const plan = await culqi.plans.createPlan({
            name: settings.title,
            amount: settings.amount,
            currency_code: settings.currency,
            interval: 'meses',
            interval_count: 1,
            limit: 12,
            metadata: {
                title: settings.title,
                browser: token.client.browser,
                ip: token.client.ip,
                ip_country: token.client.ip_country_code,
                card_brand: token.iin.card_brand,
                card_country: token.iin.issuer.country_code,
                ...metadata
            }
        });
        console.log(plan);

        const customers = await culqi.customers.getCustomers({
            email: token.email
        });
        let customer = {}
        if (customers.data.length > 0) {
            customer = customers.data[0];
        }
        else {
            customer = await culqi.customers.createCustomer({
                first_name: metadata?.firstname || 'Laraigo',
                last_name: metadata?.lastname || 'ACME',
                email: token.email,
                address: token.client.ip,
                address_city: token.client.ip_country,
                country_code: token.client.ip_country_code,
                phone_number: metadata?.phone || '999999999',
                metadata: {
                    title: settings.title,
                    browser: token.client.browser,
                    ip: token.client.ip,
                    ip_country: token.client.ip_country_code,
                    card_brand: token.iin.card_brand,
                    card_country: token.iin.issuer.country_code,
                    ...metadata
                }
            });
        }
        console.log(customer);
        
        const card = await culqi.cards.createCard({
            customer_id: customer.id,
            token_id: token.id
        });
        console.log(card);
                
        const subscription = await culqi.subscriptions.createSubscription({
            card_id: card.id,
            plan_id: plan.id
        });
        console.log(subscription);

        // Do some other operations, such save data of the subscription

        return res.json({
            error: false,
            success: true,
            data: {
                object: subscription.object,
                id: subscription.id,
                code: '',
                message: ''
            }
        });
    } catch (error) {
        return res.status(400).json({ error: true, success: false, data: error });
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
            data: {
                object: 'subscription',
                id: subscription.id,
                code: '',
                message: subscription.merchant_message
            }
        });
    } catch (error) {
        return res.status(400).json({ error: true, success: false, data: error });
    }
}