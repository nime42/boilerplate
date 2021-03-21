

function showModal(div,content,hideFunction) {


    $(div).empty();
    $(div).append(content);

    $(div).find(".close,.close-modal").unbind( "click" );
    $(div).find(".close,.close-modal").click(function() {
        if(hideFunction) {
            if(hideFunction(div)!=false) {
                hideModal(div);
            } 
        } else {
            hideModal(div);
        }
    })
    $(div).show();
}

function hideModal(div) {
    $(div).hide();
}

function modalPopUp(div,title,message) {
    $(div).find("#popup-header").text(title);
    $(div).find("#popup-message").html(message);

    $(div).find(".close, #close-button").unbind( "click" );
    $(div).find(".close,#close-button").click(function() {
            hideModal(div);
    })

    $(div).show();
}

function modalDialog(div, title, message, button1, button2) {
    $(div).find("#modal-title").text(title);
    $(div).find("#modal-message").html(message);

    $(div).find(".close, #button1,#button2").unbind( "click" );

  
    $(div).find("#button1").html(button1.text);
    $(div).find("#button1").unbind("click");
    $(div).find("#button1").click(button1.func);
  
    $(div).find("#button2").html(button2.text);
    $(div).find("#button2").unbind("click");
    $(div).find("#button2").click(button2.func);
 

    $(div).find(".close, #button1,#button2").click(function() {
            hideModal(div);
    })
  
    $(div).show();
  
  }