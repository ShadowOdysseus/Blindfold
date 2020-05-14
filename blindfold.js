/**
 * A blindfold for usage with games that require discretion.
 * TTP currently has no method of concealing objects, so this script serves to allow table makers to quickly create a blindfold.
 *
 * To use, in your global script, require "@wodysus-ttp/blindfold" and run initializeTemplate(templateId, scriptKey, offset) or initializeJSON(templateId, scriptKey, offset)
 * The templateId or templateJson is that of whatever object you want to block players vision with, when testing I used inverted models and planes
 * scriptKey is the scripting button that players can press to blind or unblind themselves, invalid numbers disable this feature.
 * If you have a more complicated placement of your object, you can use offset to relocate the object.
 *
 * For games where you want to control when players are blinded, there are two functions, isBlind and toggleBlind for
 * determining if a player is blind and changing their state.
 *
 */
const  {world, globalEvents, Vector, Player, GameObject, Rotator} = require("@tabletop-playground/api");

let bId = "";
let json = "";
let key = -1;
let offVec = new Vector(0, 0, 0);

/**
 * Check if a given GameObject is valid and still exists.
 * Duplicated from Salami's SimplyButtons script.
 * @param {GameObject} obj - The GameObject to validate
 * @returns {Boolean} Returns true if obj is a GameObject and has not been destroyed.
 */
function IsValidGameObject(obj) {
    return obj !== undefined && obj !== null && obj.isValid && obj.isValid()
}

/**
 * Rotates a vector using the given rotator.
 * @param {Vector} vector - The Vector to rotate.
 * @param {Rotator} rotator - The Rotator to apply to the vector.
 * @returns {Vector} Returns the vector after applying the rotation.
 */
function rotateVector(vector, rotator) {
    //Thanks to @sparr#4731 for simplified code
    return vector.toRotator().compose(rotator).toVector().multiply(vector.magnitude());
}

/**
 * Initialize the module to use the supplied template Id and script key. If script key is invalid, disables player toggling.
 * @param {string} templateId - The template id of the blindfold object.
 * @param {number} scriptKey - The number of the script key to use for player toggling. Invalid to disable.
 * @param {Vector} offset - A vector offset for the placement of the blindfold.
 */
function initializeTemplate(templateId, scriptKey, offset) {
    bId = templateId;
    json = "";
    key = scriptKey;
    offVec = offset;

    if (10 > scriptKey >= 0) {
        globalEvents.onScriptButtonReleased.add(function(player, button){
            if (button === scriptKey) {
                if (toggleBlind(player)) {
                    player.showMessage("You have blindfolded yourself.");
                } else {
                    player.showMessage("You have removed your blindfold.");
                }
            }
        });
    }
}
/**
 * Initialize the module to use the supplied json and script key. If script key is invalid, disables player toggling.
 * @param {string} templateJson - The json string of the blindfold object.
 * @param {number} scriptKey - The number of the script key to use for player toggling. Invalid to disable.
 * @param {Vector} offset - A vector offset for the placement of the blindfold.
 */
function initializeJSON(templateJson, scriptKey, offset) {
    json = templateJson;
    bId = ""
    key = scriptKey;
    offVec = offset;

    if (10 > scriptKey >= 0) {
        globalEvents.onScriptButtonReleased.add(function(player, button){
            if (button === scriptKey) {
                if (toggleBlind(player)) {
                    player.showMessage("You have blindfolded yourself.");
                } else {
                    player.showMessage("You have removed your blindfold.");
                }
            }
        });
    }
}

/**
 * Returns whether the player is currently blinded.
 * @param {Player} player - The player to toggle the blindfold for.
 * @returns {Boolean} Returns true if the player was blindfolded.
 */
function isBlind(player) {
    return IsValidGameObject(player.blindfold);
}

/**
 * Toggle whether the player is blinded or not, returns whether the player was blinded.
 * @param {Player} player - The player to toggle the blindfold for.
 * @returns {Boolean} Returns true if the player was blindfolded.
 */
function toggleBlind(player) {
    if (isBlind(player)) {
        player.blindfold.destroy();
        player.blindfold = null;

        return false;
    } else {
        let blindfold = null;
        if (bId !== "") {
            blindfold = world.createObjectFromTemplate(bId, player.getPosition());
        } else if (json !== "") {
            blindfold = world.createObjectFromJSON(json, player.getPosition());
        } else {
            throw "Error: toggleBlind was called before initialization";
        }

        blindfold.toggleLock();

        function autoclean(left){
            if (left === player) {
                blindfold.destroy();
            }
        }

        globalEvents.onPlayerLeft.add(autoclean);

        blindfold.onDestroyed.add(function(self){
            globalEvents.onPlayerLeft.remove(autoclean);
        });

        blindfold.onTick.add(function(self, delta){
            self.setPosition(player.getPosition().add(rotateVector(offVec, player.getRotation())));
            self.setRotation(player.getRotation());
        });

        player.blindfold = blindfold;
        return true;
    }
}

module.exports.initializeTemplate = initializeTemplate;
module.exports.initializeJSON = initializeJSON;
module.exports.toggleBlind = toggleBlind;
module.exports.isBlind = isBlind;