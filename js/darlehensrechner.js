if (!window.DARLEHENSRECHNER) { var DARLEHENSRECHNER = {}; }

DARLEHENSRECHNER.loan_computer = ( function () {
  var $current_market_taxes;
  var loan;
  var effectiv_tax_loaded = true;
  var effectiv_tax_self = false;
  var announcements_holder = [];
  var items_count;
  var items_set = 0;
  function init() {
    loan = new finanzierungsvorhaben();
    getCurrentMarketTaxes();
    initSlider();
    initEventshandler();
    initTooltips();
  }
  
  function initSlider () {
    // set sliders
    var slider_opt_monthly = {
      min: 300,
      max: 2500,
      create: function(e, ui) {
        var pos = $(".monthly_rate_slider .ui-slider-handle").position();
        $("<div>").attr("id", "tip_monthly").text("300").css( { left: pos.left -32 }).appendTo(".slider_monthly");
        calcLoan();
      },
      slide: function(e, ui) {
        var pos = $(".monthly_rate_slider .ui-slider-handle").position();
        $("#tip_monthly").text(getFormatPrice(ui.value, false)).css( {left: pos.left -32 } );
        calcLoan();
      },
      change: function(e, ui) {
        var pos = $(".monthly_rate_slider .ui-slider-handle").position();
        $("#tip_monthly").text(getFormatPrice(ui.value, false)).css( {left: pos.left -32 } );
        calcLoan();
      } 
    };
    var slider_opt_capital = {
      min: 1000,
      max: 100000,
      create: function(e, ui) {
        var pos = $(".own_capital_slider .ui-slider-handle").position();
        $("<div>").attr("id", "tip_capital").text("1.000").css( { left: pos.left -32 }).appendTo(".slider_capital");
        calcLoan();
      },
      slide: function(e, ui) {
        var pos = $(".own_capital_slider .ui-slider-handle").position();
        $("#tip_capital").text(getFormatPrice(ui.value, false)).css( {left: pos.left -32 } );
        calcLoan();
      },
      change: function(e, ui) {
        var pos = $(".own_capital_slider .ui-slider-handle").position();
        $("#tip_capital").text(getFormatPrice(ui.value, false)).css( {left: pos.left -32 } );
        calcLoan();
      } 
    };
    if ( effectiv_tax_loaded ) {
      $(".slider_monthly").slider(slider_opt_monthly);
      $(".slider_capital").slider(slider_opt_capital);
    }
  }
  
  function initEventshandler (){
    // input radios sollzinsbindung
    $('input[type="radio"]').change(function (e){
      calcLoan();
    });
    // input text Effektivzins und Tilgung
    $('input[type="text"]').change(function (e){
      var value = $(this).val()+"";
      console.log(value);
      value = value.replace(/\,/,".");
      console.log(value);
      value = parseFloat(value);
      console.log(value);
      if (isNaN(value)) {
        if ($(this).attr("id") === "interest_rate") {
          $(this).val("4");
        } else if ($(this).attr("id") === "clearance_val") {
          loan.tilgung = value;
          $(this).val("1");
        }
      } else if ( $(this).attr("id") === "clearance_val" ) {
        loan.tilgung = value;
        $(".extra_conf #clearance_val").val(layoutFloatValue(loan.tilgung));
      }
      
      if (value > 10) {
        $(this).val("10");
      } else if (value < 1) {
        $(this).val("1");
      }
      calcLoan();
    });
    // input text Effektivzins
    $('input#interest_rate').keypress(function () {
      effectiv_tax_self = true;
    });
    // input checkbox Marktzinsen
    $('#use_market_values').click( function(){
      if ($('#use_market_values').attr('checked')) {
        effectiv_tax_self = false;
      } else {
        effectiv_tax_self = true;
      }
      calcLoan();
    });
    // span "andere Angebote"
    $('.loan_compute_result .other_scout_user').click(function () {
        announcements_holder = [];
        getFinanzdataOtherScoutUser();
    });
    // Zurück button
    $('.finance_other_scout_users .left button').click(function () {
      $('.finance_other_scout_users').hide();
      $('.loan_compute_box').show();
      $('.scout_datas_list_hidden').html("");
    });
    // Angebots Detailbutton
    $('.item_detail_button_link').live("click",function () {
      $('.finance_other_scout_users').hide();
      $('.announcement_item').show();
      getAnnounceItemDetails(this);
    });
    // Zurück Button
    $('.announcement_item .left button').click(function () {
      $('.announcement_item').hide()
      $('.finance_other_scout_users').show();
    });
  }
  
  function initTooltips() {
    $('.info').tooltip({delay: 120, position: 'top left', offset: [10,-10] });
    $('.info2').tooltip({delay: 120, position: 'bottom center', offset: [20, -3] });
  }
  
  function getCurrentMarketTaxes () {
    effectiv_tax_loaded = false;
    var $data;
    $.ajax({
        type: "GET",
        url: "/rest/interestRateTrendReport",
        dataType: "xml",
        async: false,
        beforeSend: function () {
          $('.loan_compute .loan_compute_box').hide();
          $('.loan_compute .ajax_loader').show();
        },
        success: function (data){
          $current_market_taxes = $(data);
          effectiv_tax_loaded = true;
          $('.loan_compute .ajax_loader').hide();
          $('.loan_compute .loan_compute_box').show();
        },
        error: function(req, error, exception){
          $('.loan_compute .ajax_loader').hide();
          $('.loan_compute .loan_compute_box').html('<p class="error">Der Darlehensrechner ist momentan ausser Betrieb.</p>').show();
        }
    });
    return $data;
  }
    
  function calcLoan() {
    var current_interest_rate;
    var effe_tax_add_auto = true;
    if( $(".extra_conf #use_market_values").attr('checked') ){
      var time_tag = $current_market_taxes.find('loan-term');
      time_tag.each(function (index, item){
        var time_tag_value = $(item).text();
        switch (time_tag_value) {
          case "5":
            loan.effektivzins[0] = $(item).parent().find('effective-interest-rate').text();
            break;
          case "10":
            loan.effektivzins[1] = $(item).parent().find('effective-interest-rate').text();
            break;
          case "15":
            loan.effektivzins[2] = $(item).parent().find('effective-interest-rate').text();
            break;
          case "20":
            loan.effektivzins[3] = $(item).parent().find('effective-interest-rate').text();
            break;
        }
      });
      $('input#interest_rate').attr('disabled', 'disabled');
    } else {
      loan.effektivzins = loan.effektivzins_back;
      $('input#interest_rate').removeAttr('disabled');
    }
    var rate = $("#tip_monthly").html()+"";
    rate = rate.replace(/\./,"");
    loan.rate = parseInt(rate, 10);
    var own_capital = $("#tip_capital").html()+"";
    own_capital = own_capital.replace(/\./,"");
    loan.eigenkapital = parseInt(own_capital, 10);
    loan.sollzinsbindung = parseInt($('input:radio[name=debit_interest_binding]:checked').val(), 10);
    if ( !(isNaN(parseFloat($("#clearance_val").val()))) ){
      var clear_val = $("#clearance_val").val();
      clear_val = clear_val.replace( /,/,"." );
      loan.tilgung = parseFloat(clear_val);
    }
    var inter_rate = $("#interest_rate").val();
    inter_rate = inter_rate.replace( /,/,"." );
    inter_rate = parseFloat(inter_rate);
    if ( ((!(isNaN(inter_rate)) && !(effe_tax_add_auto)) || effectiv_tax_self )) {
      switch(loan.sollzinsbindung) {
        case 5:
          loan.effektivzins[0] = inter_rate;
          current_interest_rate = inter_rate;
          break;
        case 10:
          loan.effektivzins[1] = inter_rate;
          current_interest_rate = inter_rate;
          break;
        case 15:
          loan.effektivzins[2] = inter_rate;
          current_interest_rate = inter_rate;
          break;
        case 20:
          loan.effektivzins[3] = inter_rate;
          current_interest_rate = inter_rate;
          break;
      }
    } else {
      effe_tax_add_auto = false;
      switch(loan.sollzinsbindung) {
        case 5:
          current_interest_rate = loan.effektivzins[0];
          break;
        case 10:
          current_interest_rate = loan.effektivzins[1];
          break;
        case 15:
          current_interest_rate = loan.effektivzins[2];
          break;
        case 20:
          current_interest_rate = loan.effektivzins[3];
          break;
      }
    }
    loan.calculate();
    $(".loan_compute_result .sum p").html(getFormatPrice(loan.kaufpreis, true));
    $(".loan_compute_result #remain_dept").html(getFormatPrice(loan.restschuld, true));
    $(".loan_compute_result .years").html(loan.sollzinsbindung);
    $(".loan_compute_result #clearance").html(layoutFloatValue(loan.tilgung));
    $(".loan_compute_result #ann_percent_rate").html(layoutFloatValue(current_interest_rate));
    $(".extra_conf #interest_rate").val(layoutFloatValue(current_interest_rate));
    effe_tax_add_auto = true;
    $(".loan_compute_result #debit_interest").html(layoutFloatValue(loan.nominalzins.toFixed(2)));
  }
  function getFormatPrice(price, euro_sign) {
    var temp = parseInt(price * 100, 10);
    temp = temp / 100;
    //für kommastellen(2) anstatt ()
    temp = temp.toFixed();
    temp = temp.replace(/\./,",");
    while(temp.match(/^(\d+)(\d{3}\b)/)) {
      temp = temp.replace(/^(\d+)(\d{3}\b)/, RegExp.$1 + '.' + RegExp.$2);
    }
    if (euro_sign) {
      return temp +" &#128;";
    } else {
      return temp;
    }
  }
  function layoutFloatValue (float_value) {
    var temp = float_value+"";
    temp = temp.replace(/\./,",");
    return temp;
  }
  function getFinanzdataOtherScoutUser () {
    $('.scout_datas_list').empty();
    items_set = 0;
    $.ajax({
      type: "GET",
      url: "/rest/ausschreibungen?"
           +"darlehenshoehemin="+Math.round(loan.darlehen*0.9)+"&darlehenshoehemax="+Math.round(loan.darlehen*1.2)
           +"&ratemin="+Math.round(loan.rate*0.9)+"&ratemax="+Math.round(loan.rate*1.2),
      dataType: "xml",
      async: true,
      beforeSend: function () {
        $('.loan_compute .loan_compute_box').hide();
        $('.loan_compute .ajax_loader').show();
      },
      success: function (data) {
        parseAnnouncements(data);
      },
      error: function(req, error, exception){
        $('.loan_compute .ajax_loader').hide();
        $('.loan_compute .finance_other_scout_users').html('<p class="error">Der Darlehensrechner ist momentan ausser Betrieb.</p>').show();
      }
    });
  }
  
  function parseAnnouncements(xml) {
    items_count = $(xml).find("ausschreibungRef").length;
    if ( items_count > 0 ) {
      $('.finanz_datas .info_layer').hide();
      $('.scout_datas_list_hidden').html("");
      $(xml).find("ausschreibungRef").each(function(index, item) {
        if ( index < 20 ) {
          var url = $(item).attr("href").replace(/http:\/\/www.meine-baufinanzierung.de/g,"" );
          $.ajax({
            type: "GET",
            url: url,
            dataType: "xml",
            async: true,
            success: function(xml) {
              parseAnnounceItem(index, xml);
            },
            error: function(req, error, exception){
              $('.loan_compute .ajax_loader').hide();
              $('.loan_compute .finance_other_scout_users').html('<p class="error">Der Darlehensrechner ist momentan ausser Betrieb.</p>').show();
            }
          });
        }
      });
      $('.loan_compute .ajax_loader').hide();
      $('.loan_compute .finance_other_scout_users').show();
    } else {
      $('.finanz_datas .info_layer .sum').html(getFormatPrice(loan.kaufpreis, true));
      $('.finanz_datas .info_layer .own_capital').html(getFormatPrice(loan.eigenkapital, true));
      $('.loan_compute .ajax_loader').hide();
      $('.finanz_datas .info_layer').show();
      $('.loan_compute .finance_other_scout_users').show();
      $('.scout_datas_list_hidden').html("");
    }
  }
  function parseAnnounceItem(index, xml) {
    var $xml = $(xml);
    var art = $xml.find("immobilienart").text().toLowerCase();
    var place = $xml.find("ort").text().toLowerCase();
    var total_loan = getFormatPrice($xml.find("darlehenshoehe").text(), true);
    var rate = getFormatPrice($xml.find("rate").text(), true);
    var interest_bind = $xml.find("zinsbindung").text();
    var interest_rate = $xml.find("effektivzins").text().slice(0,4);
    var temp_consultant_url;
    if ($xml.find("topBerater").size() > 0) {
      temp_consultant_url = $xml.find("topBerater").attr("href");
    } else {
      temp_consultant_url = $xml.find("beraterRef").attr("href");
    }
    
    var $consultant_xml;
    var consultant_cpy_logo;
    if (temp_consultant_url) {
      var url = temp_consultant_url.replace(/http:\/\/www.meine-baufinanzierung.de/g,"" );
      $.ajax({
        type: "GET",
        url: url,
        dataType: "xml",
        async: false,
        success: function(data) {
          consultant_cpy_logo = $(data).find("logoThumbnailUrl").text();
          $consultant_xml = $(data);
        },
        error: function(req, error, exception){
          alert("Der Darlehensrechner ist momentan ausser Betrieb.");
        }
      });
    }
    var item_list_image = $('<img src="'+( consultant_cpy_logo !== undefined ? consultant_cpy_logo : "images/berater-default.gif") +'" alt="itemImage" />');
    var temp_data = '<div class="item_list_data">'
                    +'<h2><i>'+art+'</i> in <i>'+place+'</i></h2>'
                    +'<span>Darlehensh&#246;he: '+total_loan+', '
                    +rate+' monatliche Rate, '+interest_bind+' Jahre Sollzinsbindung, '
                    +layoutFloatValue(interest_rate)+' &#37; eff. Jahreszins'
                    +'</span></div>';
    var item_list_data = $(temp_data);
    var item_detail_button = $('<div class="item_detail_button"><a class="item_detail_button_link" id="detail_'+index+'"><span>Details</span></a></div>');
    var list_item = $('<li class="result"></li>').prepend(item_detail_button).prepend(item_list_data).prepend(item_list_image);
    $('.scout_datas_list_hidden').append(list_item);
    setAnnounceItemDetails( index, $xml, $consultant_xml );
  }
  function setAnnounceItemDetails( index, $xml, $consultant_xml ){
    var finanzierungsobjekt = $xml.find("finanzierungsobjekt").text().toLowerCase();
    if (finanzierungsobjekt === 'kauf_neubau') {
      finanzierungsobjekt = "Kauf Neubauobjekt";
    } else if ( finanzierungsobjekt === 'kauf_modernisierung' ) {
      finanzierungsobjekt = "Kauf und Modernisierung";
    }
    var announce_item_data = { "finanzierungsobjekt" : finanzierungsobjekt,
                               "immobilienart" : $xml.find("immobilienart").text().toLowerCase(),
                               "ort" : $xml.find("ort").text().toLowerCase(),
                               "immobiliennutzung" : $xml.find("immobiliennutzung").text().toLowerCase(),
                               "gesamtkosten" : getFormatPrice($xml.find("gesamtkosten").text(), true),
                               "darlehenshoehe" : getFormatPrice($xml.find("darlehenshoehe").text(), true),
                               "eigenkapital" : getFormatPrice($xml.find("eigenkapital").text(), true),
                               "zinsbindung" : $xml.find("zinsbindung").text(),
                               "tilgungsrate" : $xml.find("tilgungsrate").text().slice(0,4),
                               "logourl" : $consultant_xml.find("logoUrl").text(),
                               "rate" : getFormatPrice($xml.find("rate").text(), true),
                               "effektivzins" : $xml.find("effektivzins").text().slice(0,4),
                               "nominalzins" : $xml.find("nominalzins").text().slice(0,4),
                               "firmenname" : $consultant_xml.find("firmenname").text(),
                               "salutation" : $consultant_xml.find("salutation").text(),
                               "firstname" : $consultant_xml.find("firstName").text(),
                               "lastname" : $consultant_xml.find("lastName").text(),
                               "homepage" : $consultant_xml.find("homepage").text(),
                               "telefonnummer" : $consultant_xml.find("telefonnummer").text() };
    announcements_holder[index] = announce_item_data;
    items_set++;
    if ( items_set === items_count) {
      initPagination();
    }
  }
  function getAnnounceItemDetails( elem ) {
    var data = announcements_holder[parseInt($(elem).attr("id").slice(7), 10)];
    $('.announcement_item .finanzierungsobjekt').html(data.finanzierungsobjekt);
    $('.announcement_item .immobilienart').html(data.immobilienart);
    $('.announcement_item .ort').html(data.ort);
    $('.announcement_item .immobiliennutzung').html(data.immobiliennutzung);
    $('.announcement_item .gesamtkosten').html(data.gesamtkosten);
    $('.announcement_item .darlehenshoehe').html(data.darlehenshoehe);
    $('.announcement_item .eigenkapital').html(data.eigenkapital);
    $('.announcement_item .zinsbindung').html(data.zinsbindung+" Jahre");
    $('.announcement_item .tilgungsrate').html(layoutFloatValue(data.tilgungsrate)+ " &#37;");
    $('.announcement_item .logourl').attr('src', data.logourl);
    $('.announcement_item .rate').html(data.rate);
    $('.announcement_item .effektivzins').html(layoutFloatValue(data.effektivzins)+ " &#37;");
    $('.announcement_item .nominalzins').html(layoutFloatValue(data.nominalzins)+ " &#37;");
    $('.announcement_item #firmenname').html(data.firmenname);
    $('.announcement_item .salutation').html(data.salutation);
    $('.announcement_item .firstname').html(data.firstname);
    $('.announcement_item .lastname').html(data.lastname);
    $('.announcement_item #homepage a').attr('href', data.homepage).html(data.homepage);
    $('.announcement_item #telefonnummer').html("Tel.: "+data.telefonnummer);
  }
  function initPagination() {
    var num_entries = $('.scout_datas_list_hidden li.result').length;
    $("#pagination").pagination(num_entries, {
        callback: pageselectCallback,
        items_per_page: 4
    });
  }
  function pageselectCallback(page_index, jq){
    $('.scout_datas_list').empty();
    var new_content;
    page_index = page_index +1;
    var i = (page_index*4)-3;
    var y = page_index*4;
    for ( i; i <= y ; i++){
      new_content  = $('.scout_datas_list_hidden li.result:eq('+(i-1)+')').clone();
      $('.scout_datas_list').append(new_content);
    }
    return false;
  }  
  return {
    init: function () {
      return init();
    }
  };
}());

if(window.jQuery) { DARLEHENSRECHNER.loan_computer.init(); }