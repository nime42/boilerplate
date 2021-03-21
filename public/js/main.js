
function logInOut() {
    if($("#log-in-out").find("span").text()==="Logga in") {
        login();
    } else {
        logout();
    }   
}

function toggleLogInOutButton() {
    if($("#log-in-out").find("span").text()==="Logga in") {
        $("#log-in-out").find("span").text("Logga ut");      
    } else {
        $("#log-in-out").find("span").text("Logga in");       
    }   
    $("#log-in-out").find("i").toggleClass("fa-sign-in fa-sign-out");  
}


function login() {
    showModal("#basic-modal", hbsTemplates["main-snippets"]["login"]());
    $("#basic-modal").find("#log-in").click(function (e) {
        var loginInfo = collectLoginInfo("#basic-modal");
        if (loginInfo !== null) {
            $.ajax({
                type: "POST",
                url: "/login",
                cache: false,
                data: loginInfo,
                success: function (data, status, jqxhr) {
                    hideModal("#basic-modal");
                    toggleLogInOutButton();
                    initApp();
                },
                error: function (data, status, jqxhr) {
                    if (data.status === 401) {
                        modalPopUp("#popup", "Inloggning", "Ogiltigt användarnamn eller lösenord!!!");

                    } else {
                        modalPopUp("#popup", "Inloggning", "Just nu går det inte att logga in, försök senare!");

                    }
                }

            });
        }
    });

    $("#basic-modal").find('#forgot-password').click(function (e) {
        forgotPassword(e);
    });

}

function logout() {
    $.ajax({
        url: "/logout",
        cache: false,
        success: function (data, status, jqxhr) {
            deleteCookie("SessId");
            window.location.href = window.location.pathname;
            toggleLogInOutButton();
            //window.location.reload();
        }
    });
}










function forgotPassword(e) {
    data = {};
    showModal("#basic-modal", hbsTemplates["main-snippets"]["forgot-password"]());

    $("#basic-modal").find(".send-password").click(function (e) {
        var buttonId = $(this).attr('id');
        var identityType;
        var identity;
        if (buttonId === "send-mail-for-mail-adr") {
            identityType = "by-mail-adress";
            identity = $("#basic-modal").find("#email").val().trim();
            if (identity === "" || !identity.match(/^[^@]+@[^@]+\.[^@]+$/)) {
                modalPopUp("#popup", "Glömt lösenord", "Mailadress saknas eller verkar vara ogiltig!!");
                return;
            }
        } else if (buttonId === "send-mail-for-userid") {
            identityType = "by-user-id";
            identity = $("#basic-modal").find("#userid").val().trim();
            if (identity === "") {
                modalPopUp("#popup", "Glömt lösenord", "Användarnamn saknas!!");
                return;
            }
        } else {
            modalPopUp("#popup", "Glömt lösenord", "Ett tekniskt fel har inträffat!");

            return;

        }

        $.ajax({
            type: "POST",
            url: "/forgotPassword",
            cache: false,
            data: {
                identityType: identityType,
                identity: identity
            },
            success: function (data, status, jqxhr) {
                hideModal("#basic-modal");
                modalPopUp("#popup", "Glömt lösenord", "Mail med länk för återställning av lösenord skickat!\nKontrollera din inkorg om en stund.");
            },
            error: function (data, status, jqxhr) {
                if (data.status === 404) {
                    if (identityType === "by-mail-adress") {
                        modalPopUp("#popup", "Glömt lösenord", "Det finns ingen användare med denna mail-adress!!");
                    } else {
                        modalPopUp("#popup", "Glömt lösenord", "Det finns ingen användare med detta användarnamn!!");
                    }
                } else {
                    modalPopUp("#popup", "Glömt lösenord", "Det gick inte att skicka återställnings-mailet!!");
                }
            }
        });




    });



}

function resetPassword(resetToken) {
    showModal("#basic-modal", hbsTemplates["main-snippets"]["reset-password"]());
    $("#basic-modal").find("#reset-passw").click(function (e) {
        var password = $("#basic-modal").find("#password").val().trim();
        var pwd2 = $("#basic-modal").find("#password2").val().trim();

        if (password === "") {
            modalPopUp("#popup", "Återställ lösenord", "Lösenord saknas!!!");
            return false;
        }


        if (password !== pwd2) {
            modalPopUp("#popup","Återställ lösenord", "Lösenorden stämmer inte överens!!");
            return false;
        }

        $.ajax({
            type: "POST",
            url: "/resetPassword",
            cache: false,
            data: {
                password: password,
                resetToken: resetToken
            },
            success: function (data, status, jqxhr) {
                hideModal("#basic-modal");
                modalPopUp("#popup", "Återställ lösenord", "Lösenordet är uppdaterat");
                removeUrlVars();
                initApp();
                

            },
            error: function (data, status, jqxhr) {
                if (data.status === 404) {
                    modalPopUp("#popup","Återställ lösenord", "Det gick inte att uppdatera lösenordet");
                } else {
                    modalPopUp("#popup", "Återställ lösenord","Ett Tekniskt fel har inträffat, försök igen senare!");
                }
            }
        });
        return false;
    })

}



function initApp() {
    $("#start-info").hide();
    $("#logged-in").show();

    initUser();
    $("#menu-items").show(); //$('.navbar-collapse').collapse('hide');
}




function getUserInfo(callback) {
    $.ajax({
        url: "/getUserInfo",
        cache: false,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            callback(data);
        },
        error: function (data, status, jqxhr) {
            deleteCookie("SessId");
            location.reload();
        }
    });
}

function initUser() {
    globals.userinfo = {};
    getUserInfo(function (data) {
        globals.userinfo = data;
        $("#logged-in-user").text(globals.userinfo.username);


    });
}





function configureUser() {

    if (!globals.userinfo) {
        showModal("#basic-modal", hbsTemplates["main-snippets"]["user-info"]({ register: true }));
        $("#basic-modal").find("#reg-or-update").click(function (e) {
            var userInfo = collectUserInfo("#basic-modal", true);
            if (userInfo !== null) {
                $.ajax({
                    type: "POST",
                    url: "/register",
                    cache: false,
                    data: userInfo,
                    success: function (data, status, jqxhr) {
                        //reloadIfLoggedOut(jqxhr);
                        hideModal("#basic-modal");
                        toggleLogInOutButton();
                        initApp();
                    },
                    error: function (data, status, jqxhr) {
                        console.log(data, status, jqxhr);
                        if (data.status === 403) {
                            modalPopUp("#popup","Användarinfo", "Användarnamnet finns redan!");
                        } else {
                            modalPopUp("#popup","Användarinfo", "Ett Tekniskt fel har inträffat, försök igen senare!");
                        }
                    }
                });

            }
        });
    } else {


        $.ajax({
            url: "/getUserInfo",
            cache: false,
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                showModal("#basic-modal", hbsTemplates["main-snippets"]["user-info"](data));
                $("#basic-modal").find("#reg-or-update").click(function (e) {
                    if(isDemo()) {
                        modalPopUp("#popup","Demo", "Detta går inte att uppdatera användarinfo när man är i demo-läge!");
                        return;
                    }

                    var userInfo = collectUserInfo("#basic-modal");
                    if (userInfo !== null) {
                        $.ajax({
                            type: "POST",
                            url: "/updateUserInfo",
                            cache: false,
                            data: userInfo,
                            success: function (data, status, jqxhr) {
                                reloadIfLoggedOut(jqxhr);
                                hideModal("#basic-modal");
                                initApp();
                            },
                            error: function (data, status, jqxhr) {
                                modalPopUp("#popup","Användarinfo", "Ett Tekniskt fel har inträffat, försök igen senare!");
                            }
                        });
                    }
                });

            }
        });
    }
}











function showUserTerms() {
    showModal("#another-modal", hbsTemplates["main-snippets"]["user-terms"]);
}


function showContact() {
    showModal("#basic-modal", hbsTemplates["main-snippets"]["contact"]);
}