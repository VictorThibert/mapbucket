var pipsSlider = document.getElementById('slider');

noUiSlider.create(pipsSlider, {
    range: {
        min: 2015,
        max: 2016
    },
    snap: true,
    start: [ 2016 ],
    pips: { 
    	mode: 'range', 
    	values: 2,
    	density: 1000
    }

});

var pips = pipsSlider.querySelectorAll('.noUi-value');

function clickOnPip ( ) {
    var value = Number(this.getAttribute('data-value'));
    pipsSlider.noUiSlider.set(value);
}

for ( var i = 0; i < pips.length; i++ ) {

    // For this example. Do this in CSS!
    pips[i].style.cursor = 'pointer';
    pips[i].addEventListener('click', clickOnPip);
}

slider.noUiSlider.on('update', function ( ) {

	let year = parseInt(slider.noUiSlider.get());
	MYNS2.subns.updateData(year);MYNS.subns.updateGlobe(year);
	// document.getElementById('test').innerHTML = year;
});