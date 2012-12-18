// Initialize the Spotify objects
var sp = getSpotifyApi(1),
    models = sp.require("sp://import/scripts/api/models"),
    views = sp.require("sp://import/scripts/api/views"),
    ui = sp.require("sp://import/scripts/ui");
    player = models.player,
    library = models.library,
    application = models.application,
    playerImage = new views.Player();

var playlist = new models.Playlist();
var player = new views.Player();
player.context = playlist;
var list = new List(playlist);

sources = new Array();
tracks = new Array();
covers = new Array();

models.Playlist.prototype.set = function(i, item) {
    this.add(item);
    this.remove(i);
    this.data.move(this.length-1, i);
};


handleLinks = function(links) {
    links = (typeof links !== 'undefined')? links:models.application.links;
    //alert(links)
    if(links.length) {
        switch(links[0].split(":")[1]) {
            case "user":
                switch(links[0].split(":")[3]) {
                    case "playlist":
                        models.Playlist.fromURI(links[0], function(pl) {addSource(pl.name, 'playlist', pl);});
                    default:
                        break;
                }
                break;
            default:
                // Play the given item
                playlist.add(models.Track.fromURI(links[0]));
                break;
        }       
    } 
}


updating = false;
dirty = false;
c = 0;

var running = false;
var dirty = false;
var index = 0;
var totalCount = 0;
var numTracks = 50;
var oldTracks = new Array();
var interval = 100; //ms

tick = function() {
    if (dirty) {
        dirty = false;
        index = 0;
    }
    //$("#left").append(" "+index);
    if (index == 0) {
        // recalc influence
        totalInfluence = 0;
        for (i in sources) {
            totalInfluence += sources[i].influence
        }
        for (i in sources) {
            sources[i].desiredInfluence = sources[i].influence/totalInfluence
            sources[i].count = 0
        }
        totalCount = 0;
        //$("#left").append(" x"+index);
    }

    if (index < numTracks) {
        // Record old track
        if (playlist.length > index) {
            oldTrack = playlist.get(index)
            if (!(oldTrack in tracks)) oldTrack = null;
        } else {
            oldTrack = null;
        }

        // Determine next source
        var sourceId = 0;
        for (var i=1;i<sources.length;i++) {
            if (((totalCount*sources[i].desiredInfluence)-sources[i].count)
                > ((totalCount*sources[sourceId].desiredInfluence)-sources[sourceId].count)) 
                sourceId = i;
        }
        source = sources[sourceId];

        newTrack = null;
        // Keep same track if suitable
        //$("#left").append(" y"+index);
        if (oldTrack != null && sourceId in tracks[oldTrack]) {
            //$("#left").append(" z"+index);
            newTrack = oldTrack
        } else {
            // Keep previously used track if suitable
            for (i in oldTracks) {
                if (sourceId in tracks[oldTracks[i]]) {
                    newTrack = oldTracks.splice(i,1);
                }
            }

            // Otherwise choose a track we havn't used recently
            if (newTrack === null) {
                leastPlayedTrack = source.tracks[0];
                for (var i=1; i<source.tracks.length;i++) {
                    if (tracks[leastPlayedTrack]['count'] > tracks[source.tracks[i]]['count']) {
                        leastPlayedTrack = source.tracks[i];
                    }
                }
                newTrack = leastPlayedTrack;
            }

            if (oldTrack != null) {
                // Record old track encase for priority add later
                oldTracks.push(oldTrack);
                tracks[oldTrack]['count']--;

                // Update track cover size
                if (tracks[oldTrack]['count'] == 0) {
                    $(covers[oldTrack]).hide().show().width(0).height(0);
                } else if (tracks[oldTrack]['count'] < 4) {
                    $(covers[oldTrack]).show().width(64).height(64);
                } else if (tracks[oldTrack]['count'] < 16) {
                    $(covers[oldTrack]).show().width(128).height(128);
                } else {
                    $(covers[oldTrack]).show().width(256).height(256);
                }
                $('.side').masonry('reload');
            }
        }

        //$("#left").append(" a"+index);
        // Increase counts
        track = tracks[newTrack];
        for (i in track) {
            if (i == "count") {
                if (newTrack != oldTrack) {
                    // Update cover size
                    track[i]++;
                    if (track['count'] < 4) {
                        $(covers[newTrack]).show().width(64).height(64);
                    } else if (track['count'] < 16) {
                        $(covers[newTrack]).show().width(128).height(128);
                    } else {
                        $(covers[newTrack]).show().width(256).height(256);
                    }
                    $('.side').masonry('reload');
                }
            } else {
                sources[i].count++
                totalCount++
            }
        }
        
        if (oldTrack === null) {
            playlist.add(newTrack)
            updateList(list, index);
        } else {
            if (oldTrack != newTrack) {
                playlist.set(index, newTrack);
                updateList(list, index);
            }
        }
    } else {
        if (!dirty) {
            running = false;
            return;
        }  
    }

    index++;
    setTimeout("tick()", interval);
}

onChangeInfluence = function() {
    dirty = true;
    if (!running) {
        running = true;
        tick();
    }
}
/*
onChangeInfluence = function() {
    if (updating) {
        dirty = true;
        return;
    }
    c++;
    updating = true;
    dirty = false;

    totalInfluence = 0;
    for (i in sources) {
        totalInfluence += sources[i].influence
    }
    for (i in sources) {
        sources[i].desiredInfluence = sources[i].influence/totalInfluence
        sources[i].count = 0
    }

    totalCount = 0;
    var numTracks = 30;
    var oldTracks = new Array();
    for (var trackIdx=0;trackIdx<numTracks;trackIdx++) {
        if (dirty) {
            alert("Dirty");
            trackIdx = 0;
            dirty = false;
            alert("Dirty2");
        }

        //alert(trackIdx);
        //$("#left").append(" "+trackIdx)
        // Record old track
        if (playlist.length > trackIdx) {
            oldTrack = playlist.get(trackIdx)
            if (!(oldTrack in tracks)) oldTrack = null;
        } else {
            oldTrack = null;
        }
        //alert(oldTrack)

        // Determine next source
        nJ = 0;
        for (var j=1;j<sources.length;j++) {
            if (((totalCount*sources[j].desiredInfluence)-sources[j].count)
                > ((totalCount*sources[nJ].desiredInfluence)-sources[nJ].count)) 
                nJ = j;
        }
        source = sources[nJ];
        //alert(source);
        newTrack = null;
        // Keep same track if suitable
        //$("#left").append(" A"+trackIdx)
        if (oldTrack != null && nJ in tracks[oldTrack]) {
            //alert("G");
            newTrack = oldTrack
        } else {
            for (i in oldTracks) {
                //alert(i);
                if (nJ in tracks[oldTracks[i]]) {
                    newTrack = oldTracks.splice(i,1);
                }
            }
            if (newTrack === null) {
                leastPlayedTrack = source.tracks[0];
                //alert(leastPlayedTrack);
                for (var i=1; i<source.tracks.length;i++) {
                    //alert(i);
                    if (tracks[leastPlayedTrack]['count'] > tracks[source.tracks[i]]['count']) {
                        leastPlayedTrack = source.tracks[i];
                    }
                }
                newTrack = leastPlayedTrack;
            }
            //alert(">"+oldTrack);
            if (oldTrack != null) {
                oldTracks.push(oldTrack);
                //alert(">"+tracks[oldTrack]['count']);
                tracks[oldTrack]['count']--;

                //$("#left").append(" A"+trackIdx)
                if (tracks[oldTrack]['count'] == 0) {
                    $(covers[oldTrack]).hide();
                } else if (tracks[oldTrack]['count'] < 4) {
                    $(covers[oldTrack]).show().width(64).height(64);
                } else if (tracks[oldTrack]['count'] < 16) {
                    $(covers[oldTrack]).show().width(128).height(128);
                } else {
                    $(covers[oldTrack]).show().width(256).height(256);
                }
                //$("#left").append(" B"+trackIdx)
            }
        }
        track = tracks[newTrack];
        for (i in track) {
            if (i == "count") {
                if (newTrack != oldTrack) {
                    track[i]++;
                    //$("#left").append(" C"+trackIdx)
                    if (track['count'] < 4) {
                        $(covers[newTrack]).show().width(64).height(64);
                    } else if (track['count'] < 16) {
                        $(covers[newTrack]).show().width(128).height(128);
                    } else {
                        $(covers[newTrack]).show().width(256).height(256);
                    }
                    //$("#left").append(" D"+trackIdx)
                    sleep(1);
                }
            } else {
                sources[i].count++
                totalCount++
            }
        }
        
        if (oldTrack === null) {
            playlist.add(newTrack)
        } else {
            if (oldTrack != newTrack) {
                playlist.set(trackIdx, newTrack);
            }
        }
    }
    //$("#db1").text($("#db1").text()+playlist);
    updating = false;
}*/


onAddSource = function(sourceId) {
    source = sources[sourceId];

    switch (sources[sourceId].type) {
        case 'playlist':
            pl = sources[sourceId].object
            var l = pl.length;
            for (var i=0;i<l;i++) {
                source.tracks.push(pl.get(i))
            }
    }
    for (i in source.tracks) {
        track = source.tracks[i]
        if (!(track in tracks)) {
            tracks[track] = new Array();
            tracks[track]["count"] = 0;
            covers[track] = new views.Image(track.image).node;
            $(covers[track]).width(0).height(0);
            $("#left").append(covers[track]);
            $('.side').masonry('reload');
        }
        tracks[track][sourceId] = 0;
    }
    onChangeInfluence()
}

addSource = function(name, type, object) {
    var source = Object();
    source.type = type;
    source.object = object;
    source.influence = 50;
    source.tracks = Array()
    source.slider = $('<div class="slider">').slider({range: "min", step: 5, value: 50, max: 100/.71, orientation: "vertical"});
    if (object == null) {
        source.artwork = $('<div class="artwork">');
    } else {
        source.artwork = $(new views.Image(object.image).node).addClass("artwork");
    }
    $("#controls").append(
        $('<div class="control">').append(
            source.slider,
            $('<div class="name">').text(name),
            source.artwork
        )
    );
    source.slider.bind("slide", function(event, ui) {
        if (ui.value > 100) {
            if (source.influence != 100) {
                source.influence = 100;
                source.slider.slider( "option", "value", 100);
                onChangeInfluence();
            }
            return false;
        }
        source.influence = ui.value;
        onChangeInfluence();
    });
    sources.push(source);
    onAddSource(sources.length-1)
}

$(function () {

    $("body").css("height", $(window).height());
    $(window).resize(function() {
        $("body").css("height", $(window).height());
    });

    no = function(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    $(window).on('dragover', no).on('dragenter', no).on('drop', function(e,ui) {
        handleLinks([e.originalEvent.dataTransfer.getData("text/uri-list")]);
    });

    $("#listen").on('click', function () {
        models.player.play(playlist.get(0), playlist, 0);
    });

    $('#left').masonry({
        itemSelector: '.sp-image',
        isRTL: true,
        columnWidth: 64
    });
    $('#right').masonry({
        itemSelector: '.sp-image',
        columnWidth: 64
    });

    $("#player").replaceWith(player.node);
    $("#playlist").replaceWith(list.node);

    // Handle items 'dropped' on your icon
    application.observe(models.EVENT.LINKSCHANGED, handleLinks);

});