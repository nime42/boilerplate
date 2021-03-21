module.exports = {

    app: {
        http:8080,
        https:8443
    },

    mail: {
        service: "gmail",
        user: "tipsy.nu@gmail.com",
        passwd: "?????",        
        port:25
    },



    certs: {
        privateKey:"./resources/private.key",
        certificate:"./resources/certificate.crt",
        ca:"./resources/ca_bundle.crt"

    }


}