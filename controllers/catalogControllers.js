const { getErrorCode } = require('../config/helpers');
const axios = require('axios')

exports.createCatalog = async (req, res) => {
    try {
        const { name, businessid } = req.body;

        const data = {"name": name}

        const token = "EAAeSP9wcsHQBAFZB58CnwsX31r8tHOA1nd6ZBr1aZAmZBqZCldYt6RjrEOlnLiJkZAZCwtYJpiySMB4Q5ohqglNb4rBAZBI48OzTAsMMizlEEwq98FZCHDkeNQbrcp5XwwvxyEKSjvgHs0GJokXroA1Ielp0MQ0x1H3DWMmbool3AVDKleJ3lXZAKt";
        const url = `https://graph.facebook.com/${businessid}/owned_product_catalogs`;
        const config = {headers: {Authorization: 'Bearer ' + token,}};

        const result = await axios.post(url, data, config );
        console.log(result.data);
        return res.status(200).json(result.data);
        
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }

}
exports.getAllCatalog = async (req, res) => {
    try {
        const { businessid } = req.body;

        const token = "EAAeSP9wcsHQBAFZB58CnwsX31r8tHOA1nd6ZBr1aZAmZBqZCldYt6RjrEOlnLiJkZAZCwtYJpiySMB4Q5ohqglNb4rBAZBI48OzTAsMMizlEEwq98FZCHDkeNQbrcp5XwwvxyEKSjvgHs0GJokXroA1Ielp0MQ0x1H3DWMmbool3AVDKleJ3lXZAKt";
        const url = `https://graph.facebook.com/${businessid}/owned_product_catalogs`;
        const config = {headers: {Authorization: 'Bearer ' + token,}};
    
        const result = await axios.get(url, config );
        console.log(result.data);
        return res.status(200).json(result.data);
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.getAllBusiness = async (req, res) => {
    try {
    
        const token = "EAAeSP9wcsHQBAFZB58CnwsX31r8tHOA1nd6ZBr1aZAmZBqZCldYt6RjrEOlnLiJkZAZCwtYJpiySMB4Q5ohqglNb4rBAZBI48OzTAsMMizlEEwq98FZCHDkeNQbrcp5XwwvxyEKSjvgHs0GJokXroA1Ielp0MQ0x1H3DWMmbool3AVDKleJ3lXZAKt";
        const url = `https://graph.facebook.com/me/businesses`;
        const config = {headers: {Authorization: 'Bearer ' + token,}};
    
        const result = await axios.get(url, config );
        console.log(result.data);
        return res.status(200).json(result.data);
        
    } catch (exception) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid));
    }
}

exports.deleteCatalog = async (req, res) => {
    try {
        const { catalogid } = req.body;

        const token = "EAAeSP9wcsHQBAFZB58CnwsX31r8tHOA1nd6ZBr1aZAmZBqZCldYt6RjrEOlnLiJkZAZCwtYJpiySMB4Q5ohqglNb4rBAZBI48OzTAsMMizlEEwq98FZCHDkeNQbrcp5XwwvxyEKSjvgHs0GJokXroA1Ielp0MQ0x1H3DWMmbool3AVDKleJ3lXZAKt";
        const url = `https://graph.facebook.com/${catalogid}`;
        const config = {headers: {Authorization: 'Bearer ' + token,}};
    
        const result = await axios.delete(url, config );
        console.log(result.data);
        return res.status(200).json(result.data);
        
    } catch (error) {
        return res.status(500).json(getErrorCode(null, exception, `Request to ${req.originalUrl}`, req._requestid)); 
    }

}