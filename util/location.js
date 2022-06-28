async function getCoordsForAddress(address){ //async means its wrapped in a Promise (equivalent to Task in C# :p)
 
    return {
        lat: address.length,
        lng: -1 * address.length/2
    }
}

module.exports = getCoordsForAddress;