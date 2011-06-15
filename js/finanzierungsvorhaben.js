function finanzierungsvorhaben(){
  this.sollzinsbindung=5;
  this.effektivzins=[3.92, 4.29, 4.69, 4.82];
  this.effektivzins_back=[3.92, 4.29, 4.69, 4.82];
  this.baufizins=true;
  this.tilgung=1.00;
  this.rate=300;
  this.eigenkapital=1000;
  
  this.maximalbetrag=0;
  this.kaufpreis=0;
  this.restschuld=0;
  this.darlehen=0;
  // wert für sollzins
  this.nominalzins=0;
  this.annuitaet=0;
  this.modernisierung=0;
  this.volltilgung=false;
  this.monate=0;
    
  //nebenkosten
  var SICHERHEITSAUFSCHLAG = 0.05; //sicherheitsaufschlag
  var MARKLERCOURTAGE = 0.05; // marklercourtage
  var NOTARGRUNDBUCH = 0.015; //notar und grundbuchkosten
  var GRUNDERWERB = 0.035; //grunderwerbssteuer

  this.getSicherheitsaufschlag = function(){
    return this.maximalbetrag * SICHERHEITSAUFSCHLAG;
  };
  
  this.getMarklercourtage = function(){
    return this.maximalbetrag * MARKLERCOURTAGE;
  };
  
  this.getNotarGrundbuchkosten = function(){
    return this.maximalbetrag * NOTARGRUNDBUCH;
  };
  
  this.getGrunderwerbssteuer = function(){
    return this.maximalbetrag * GRUNDERWERB;
  };
  
  this.getJahresLeistung = function(){
    return this.rate * 12;
  };
  
  this.getNebenkosten = function(){
    return this.getSicherheitsaufschlag() + this.getMarklercourtage() + this.getNotarGrundbuchkosten() + this.getGrunderwerbssteuer();
  };
  // return zins due to selected sollzinsbindung  
  this.getCurrentZins = function(){
    switch (this.sollzinsbindung){
      case 5:
        return this.effektivzins[0];
      case 10:
        return this.effektivzins[1];
      case 15:
        return this.effektivzins[2];
      case 20:
        return this.effektivzins[3];
    }
  };
  // sollzins wert
  this.calculateNominalzins = function(){
    var ns = this.round_float((Math.pow((1+(this.getCurrentZins()/100)),(1/12))-1)*1200,3);
    return ns;
  };
  
  this.calculateAnnuitaet = function(){
    return this.darlehen*(this.tilgung+this.nominalzins)/100/12;
  };
  
  this.calculateRestschuld = function(){
    var v0 = (parseFloat(this.tilgung)+parseFloat(this.nominalzins))/100/12;
    var v1 = this.darlehen*v0;
    var v2 = Math.pow(1+this.nominalzins/12/100,this.sollzinsbindung*12)-1;
    var v3 =v2/(this.nominalzins/12/100);
    var v4 = this.nominalzins/100/12;
    var v5 = v1-this.darlehen*v4;
    var result = this.darlehen-v5*v3;

    return (result<0?0:result);
  };  
  
  this.calculateAnfaenglicheZinsrate = function(){
    return (this.darlehen*(this.nominalzins/100))/12;
  };

  
  this.calculate = function(){  
    this.effektivzins = [this.round_float(this.effektivzins[0],3),
                 this.round_float(this.effektivzins[1],3),
                 this.round_float(this.effektivzins[2],3),
                 this.round_float(this.effektivzins[3],3)];
               
    this.nominalzins = this.calculateNominalzins();
  
  // calculate darlehen
    var nenner = this.round_float(this.nominalzins,3)+this.round_float(this.tilgung,3);
    // calculate darlehen
    this.darlehen = Math.round(this.getJahresLeistung()/nenner)*100;
    // calculate restschuld
    this.restschuld = this.calculateRestschuld();


    // calculate maximalbetrag to spend
    this.maximalbetrag = Math.round(parseInt(this.darlehen, 10)+parseInt(this.eigenkapital, 10));

    // calculate kaufpreis = maximalbetrag - additional charges
    this.kaufpreis = this.maximalbetrag - (this.getNebenkosten() + this.modernisierung);
  
  };
  this.round_float = function(x,n){
    if(!parseInt(n, 10)){n=0;}
    if(!parseFloat(x)){return false;}
    return Math.round(x*Math.pow(10,n))/Math.pow(10,n);
  };
}
