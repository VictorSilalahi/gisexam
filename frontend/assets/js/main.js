$(document).ready(function() {

    // show the map
    var map = L.map('map').setView([-5.3464533,34, 539799], 3);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidmljdG9yc2lsYWxhaGkiLCJhIjoiY2tjajExeDhoMTM3dTJ6cXliZDhub2ViMCJ9.57DXnhV08HOspy-4Iq6xNw', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoidmljdG9yc2lsYWxhaGkiLCJhIjoiY2tjajExeDhoMTM3dTJ6cXliZDhub2ViMCJ9.57DXnhV08HOspy-4Iq6xNw'
    }).addTo(map);
 
    $(".btn-processing").on("click", function() {

        if ($("#shpFile").val()=='')
        {
            alert("Error! No shapefile!");
            return false;
        }
        else
        {
            if (checkIsSHP($("#shpFile").val())==true)
            {
                // upload file to server
                var myFormData = new FormData();
                myFormData.append('shapeFile', $("#shpFile").prop("files")[0]);
                $.LoadingOverlay("show");

                $.ajax({
                    url: 'http://127.0.0.1:5000/upload',
                    type: 'POST',
                    processData: false, 
                    contentType: false, 
                    dataType : 'json',
                    data: myFormData,
                    success : function(data) {
                        showData(data, map);
                    }
                });

                $("#shpFile").val(null);
                $.LoadingOverlay("hide");

            }
            else
            {
                alert("File must using zip format!");
                $("#shpFile").focus();
                return false;
            }
        }
    
    });

});

function checkIsSHP(nFile) {
    fName = nFile;
    extension = fName.split('.').pop();
    if (extension=="zip")
    {
        return true;
    }
    else
    {
        return false;
    }
};

function showData(dat, m) 
{
    console.log(dat);
    var columns = Object.keys(dat);
    var str = "<table class='table'><thead class='thead-dark'><tr>";
    str=str+"<th>Column Name</th></th></tr></thead><tbody>";
    for (var i=0; i<columns.length; i++)
    {
        if (columns[i]!='folder')
        {
            str=str+"<tr><td>"+columns[i]+"</td></tr>";
        }
    }
    str=str+"<tr><td>File Type : <select id='slcFileType'><option value='"+dat['folder'][0][0]+"'>KML</option><option value='"+dat['folder'][0][1]+"'>GEOJSON</option></select>&nbsp;<button class='btn btn-default btn-download'>Download</button></td></tr>";
    str=str+"</tbody></table>";
    $("#tblData").html(str);

    // show data in map
    for (var l=0; l<dat[columns[0]].length; l++)
    {
        if (dat['geom_type'][l]=='Point')
        {
            L.marker(dat['data'][l]).addTo(m);
        }
        if (dat['geom_type'][l]=='Polygon')
        {
            var pg = L.polygon(dat['data'], {color: 'red'}).addTo(m);
            m.fitBounds(pg.getBounds());
        }
    }
}

$(document).on("click",".btn-download", function() 
{
    //alert($("#slcFileType").val());
    window.open($("#slcFileType").val());
});