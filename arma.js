// az arma rendszer példányunk
var rendszer;

// a bemeneti értékeket tartalmazó lista
var bemenetek = [];

// a Chart.js által létrehozott grafikon példányunk
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
     * Shiftregiszterek inicializálása. (nullákkal feltöltve)
     */
    this.shiftreg_init = function(){
        this.y = new Array(this.n); // autoregresszív shiftregiszter (n kimenet)
        for(var i=0; i<this.y.length; i++) this.y[i]=0;
        this.u = new Array(this.r); // mozgóátlag shiftregiszter (r bemenet)
        for(var i=0; i<this.u.length; i++) this.u[i]=0;
    };
    
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

/**
 * Egy textarea tartalmának átalakítása egy számokkal feltöltött listává.
 * Minden számot tartalmazó sor a beviteli mezőben, bekerül a listába.
 * 
 * @param textarea A soronként 1-1 számot tartalmazó szövegbeviteli mező.
 * @returns A számokat tartalmazó lista.
 */
function text2numbers(textarea){
    // szétválasztjuk sorokra a szöveget
    var sorok = textarea.value.split('\n');
    
    // ha egy sor számot tartalmaz, akkor azt a listába írjuk
    var lista = [];
    for(var i=0; i<sorok.length; i++){
        if(!isNaN(parseFloat(sorok[i]))){
             lista.push(parseFloat(sorok[i]));
        }
    }
    
    return lista;
}

/**
 * A megadott rendszer futtatása a megadott bemenettel, a kimeneti mező
 * és a grafikon frissítése.
 */
function futtat(){
    // bemenetek értelmezése
    var textarea_u = document.getElementsByName("textarea_u")[0];
    bemenetek = text2numbers(textarea_u);
    
    // kimenetek számítása
    var y=[];
    try{
        rendszer.shiftreg_init();
        for(var i=0; i<bemenetek.length; i++){
           y.push(rendszer.gerjeszt(bemenetek[i]));
        }
    } catch (err){
        // ha nem sikerült kimenetet számítani, akkor a bemenetet se mutassuk
        bemenetek = [];
    }
    
    // szöveges és grafikus megjelenítés
    var textarea_y = document.getElementsByName("textarea_y")[0];
    textarea_y.value = y.join("\n");
    grafikon.data.datasets[0].data = [];
    grafikon.data.datasets[1].data = [];
    
    // be- és kimenetek grafikus megjelenítése
    for(var i=0; i<bemenetek.length; i++){
        grafikon.data.datasets[0].data.push({x: i, y: y[i]});
        grafikon.data.datasets[1].data.push({x: i, y: bemenetek[i]});
    }
    grafikon.update();
}

/**
 * A rendszerünk inicializálása a megadott együtthatók alapján. A függvény
 * automatikusan futtatja is a rendszert a létrehozás után.
 */
function rendszer_init(){
    // együtthatók kiszedése a bemeneti mezőkből
    var textarea_ad = document.getElementsByName("textarea_ad")[0];
    var textarea_bd = document.getElementsByName("textarea_bd")[0];
   
    var ad=text2numbers(textarea_ad), bd=text2numbers(textarea_bd);
    
    // új rendszer létrehozása
    rendszer = new Arma(bd, ad);
    
    // rendszer futtatása
    futtat();
}

/**
 * Billentyűlenyomás callback a szövegbeviteli mezőkön. Ellenőrzni, hogy
 * történt-e változás, és ha igen, hol. (A rendszer együtthatói változtak-e
 * vagy csak a bemeneti értékek.) A változástól függően újrainicializálja
 * a rendszert vagy újraszámolja a kimeneteket.
 * 
 * @param hol Az a beviteli mező, ahol a billentyűlenyomás történt.
 */
function gombnyomas(hol){
    // megnézzük, hol történt billentyűlenyomás
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

/** 
 * Választás callback, ami akkor hívódik meg, amikor valamelyik grafikon
 * típusa meg lett változtatva.
 * 
 * @param selector Az a legördülő választó, ahol változás történt.
 */
function grafikon_tipus(selector){
    // melyik grafikon típusa lett megváltoztatva?
    var dataset;
    switch(selector.id){
        case "select_grafikon_tipus_y":
            dataset = grafikon.data.datasets[0];
            break;
        case "select_grafikon_tipus_u":
            dataset = grafikon.data.datasets[1];
            break;
    }
    
    // milyen típus lett kiválasztva?
    switch(selector.value){
        case "pontok":
            dataset.showLine = false;
            dataset.steppedLine = false;
            break;
        case "lepcsos":
            dataset.showLine = true;
            dataset.steppedLine = true;
            break;
        case "egyenes":
            dataset.showLine = true;
            dataset.steppedLine = false;
            dataset.lineTension = 0;
            break;
        case "gorbe":
            dataset.showLine = true;
            dataset.steppedLine = false;
            dataset.lineTension = 0.4;
            break;
    }
    
    // grafikon frissítése
    grafikon.update();
}

/**
 * A szkript belépési pontja. A html dokumentum betöltésekor kerül meghívásra,
 * a legelső init funkciókat hajtja végre.
 */
function arma_main(){
    // grafikon létrehozása
    var ctx = document.getElementById("grafikon");
    var options = {
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom',
                ticks: {beginAtZero:true}
            }],
            yAxes: [{
                type: 'linear',
                position: 'left',
                ticks: {beginAtZero:true}
            }]
        }
    };
    var data = {datasets:[{borderColor: "red",
                           backgroundColor: "red",
                           fill:false,
                           label:"y(t)",
                           data:[]},
                          {borderColor: "blue",
                           backgroundColor: "blue",
                           fill:false,
                           label:"u(t)",
                           data:[]}
                   ]};
    grafikon = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
    
    //grafikon típus beállítása
    grafikon_tipus(document.getElementById("select_grafikon_tipus_u"));
    grafikon_tipus(document.getElementById("select_grafikon_tipus_y"));
    
    // rendszer init
    rendszer_init();
}

// belépési pont meghívása, ha a html dokumentum betöltődött
document.addEventListener("DOMContentLoaded", arma_main);