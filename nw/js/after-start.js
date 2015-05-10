module.exports = function(){
	var gui = window.require('nw.gui');
	win = gui.Window.get();
	var nativeMenuBar = new gui.Menu({ type: "menubar" });
	try {
		nativeMenuBar.createMacBuiltin("Piecemaker2");
		win.menu = nativeMenuBar;
	} catch (ex) {
		console.log(ex.message);
	}
};