function nl2br (str) {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
}

//todo: disable any try to save models
//Backbone.sync = function() {}

var S = $.localStorage;
var D = new Dashboard({ storage: $.localStorage });

//go
!function(){
  
  var $head = $("#head")

  new VNav({ model: D, el : document.getElementById("head") });
  new VMain({ model: D, el : document.getElementById("main") });
  new VProjectsMenu({ el : $head.find(".projects")[0], model: D });
  new VFilerTypes({ model: D, el : document.getElementById("types") });
  new VModalDetails({ model: D, el : document.getElementById("modal-details") });

  if(!S.isEmpty("token")) {
    D.start(S.get("token"));
  }
  // DEBUG $(".modal").modal({ show: true});

}()
