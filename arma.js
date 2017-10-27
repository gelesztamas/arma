// az arma rendszer példányunk
var rendszer = undefined;

// bemenetek
var bemenetek = [];

// grafikon
var grafikon;

/**
 * ARMA rendszer konstruktor.
 * 
 * @param ad Autoregresszív együtthatók listája.
 * @param bd Mozgóátlag együtthatók listája.
 */
function Arma(bd, ad){
    // a rendszer legfőbb paramétrerei
    this.n = ad.length;   // autoregresszív shiftregiszter mérete
    this.r = bd.length-1; // mozgóátlag shiftregiszter mérete
    this.ad = ad;         // autoregresszív együtthatók (n darab)
    this.bd = bd;         // mozgóátlag együtthatók (r+1 darab)
    
    /**
     * Shiftregiszter inicializálása. (nullákkal feltöltve)
     */
    this.shiftreg_init = function(){
        this.y = new Array(this.n); // autoregresszív shiftregiszter (n kimenet)
        for(var i=0; i<this.y.length; i++) this.y[i]=0;
        this.u = new Array(this.r); // mozgóátlag shiftregiszter (r bemenet)
        for(var i=0; i<this.u.length; i++) this.u[i]=0;
    };
    
    // rögtön nullázzuk is a shiftregisztereket
    this.shiftreg_init();
    
    /**
     * Rendszer futtatása.
     * @param u A gerjesztés értéke.
     * @returns A kimenet értéke.
     */
    this.gerjeszt = function(u){
        var y=0;
        
        // mozgóátlag számítása
        y += u*this.bd[0];
        for(var i=0; i<this.r; i++){
            y += this.bd[i+1] * this.u[i];
        }
        
        // autoregresszív rész számítása
        for(var i=0; i<this.n; i++){
            y -= this.ad[i] * this.y[i];
        }
        
        // shiftregiszterek léptetése
        this.u.unshift(u);
        this.u.pop();
        this.y.unshift(y);
        this.y.pop();
        
        return y;
    };
}

// textarea számlistává alakítása
function text2numbers(textarea){
    var sorok = textarea.value.split('\n');
    var lista = [];
    for(var i=0; i<sorok.length; i++){
        if(!isNaN(parseFloat(sorok[i]))){
             lista.push(parseFloat(sorok[i]));
        }
    }
    return lista;
}

// kimenetek kiszámítása
function futtat(){
    var textarea_u = document.getElementsByName("textarea_u")[0];
    var textarea_y = document.getElementsByName("textarea_y")[0];
    bemenetek = text2numbers(textarea_u);
    rendszer.shiftreg_init();
    var y=[];
    for(var i=0; i<bemenetek.length; i++){
       y.push(rendszer.gerjeszt(bemenetek[i]));
    }
    textarea_y.value = y.join("\n");
    
    
    // grafikonon való kirajzolás
    grafikon.data.datasets[0].data = [];
    grafikon.data.datasets[1].data = [];
               
    for(var i=0; i<bemenetek.length; i++){
        grafikon.data.datasets[0].data.push({x: i, y: bemenetek[i]});
        grafikon.data.datasets[1].data.push({x: i, y: y[i]});
    }
    
    grafikon.update();
}

// rendszer inicializálása
function rendszer_init(){
    // együtthatók kiszedése a bemeneti mezőkből
    var textarea_ad = document.getElementsByName("textarea_ad")[0];
    var textarea_bd = document.getElementsByName("textarea_bd")[0];
   
    var ad=text2numbers(textarea_ad), bd=text2numbers(textarea_bd);
    
    // új rendszer létrehozása
    if(bd.length > 0){
        rendszer = new Arma(bd, ad);
    } else {
        rendszer = new Arma([0], ad);
    }
    
    // rendszer futtatása
    futtat();
}

// gomblenyomás handler
function gombnyomas(hol){
    // megnézzük, hol van változás
    var elozo_lista;
    switch(hol.name){
        case "textarea_ad":
            elozo_lista = rendszer.ad;
            break;
        case "textarea_bd":
            elozo_lista = rendszer.bd;
            break;
        case "textarea_u":
            elozo_lista = bemenetek;
            break;
    }
    
    var uj_lista = text2numbers(hol);
    
    // ha a rendszerben van változás, újrainicializáljuk
    // ha csak a bemenetben, akkor újrafuttatjuk
    if(JSON.stringify(uj_lista) !== JSON.stringify(elozo_lista)){
        switch(hol.name){
            case "textarea_ad":
            case "textarea_bd":
                rendszer_init();
                break;
            case "textarea_u":
                futtat();
                break;
        }
    }
}

//
function grafikon_tipus(selector){
    switch(selector.value){
        case "pontok":
            grafikon.options.showLines = false;
            grafikon.data.datasets[0].steppedLine = false;
            grafikon.data.datasets[1].steppedLine = false;
            break;
        case "lepcsos":
            grafikon.options.showLines = true;
            grafikon.data.datasets[0].steppedLine = true;
            grafikon.data.datasets[1].steppedLine = true;
            break;
        case "egyenes":
            grafikon.options.showLines = true;
            grafikon.data.datasets[0].steppedLine = false;
            grafikon.data.datasets[1].steppedLine = false;
            grafikon.data.datasets[0].lineTension = 0;
            grafikon.data.datasets[1].lineTension = 0;
            break;
        case "gorbe":
            grafikon.options.showLines = true;
            grafikon.data.datasets[0].steppedLine = false;
            grafikon.data.datasets[1].steppedLine = false;
            grafikon.data.datasets[0].lineTension = 0.4;
            grafikon.data.datasets[1].lineTension = 0.4;
            break;
    }
    grafikon.update();
}

// a szkript belépési pontja
function arma_main(){
    // grafikon létrehozása
    var ctx = document.getElementById("grafikon");
    var options = {
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom'
            }]
        }
    };
    var data = {datasets:[{borderColor: "blue",
                           backgroundColor: "blue",
                           fill:false,
                           label:"u(t)",
                           data:[]},
                          {borderColor: "red",
                           backgroundColor: "red",
                           fill:false,
                           label:"y(t)",
                           data:[]}
                   ]};
    grafikon = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
    
    // rendszer init
    rendszer_init();
    
    //grafikon típus beállítása
    grafikon_tipus(document.getElementById("select_grafikon_tipus"));
}

// szkript indítása, ha az oldal betöltődött
document.addEventListener("DOMContentLoaded", arma_main);