var Ally;
(function (Ally) {
    /**
     * The controller for the admin-only page to edit group boundary polygons
     */
    class ManageAddressPolysController {
        /**
        * The constructor for the class
        */
        constructor($http, $q) {
            this.$http = $http;
            this.$q = $q;
            this.isLoading = false;
            this.includeAddresses = false;
        }
        /**
        * Called on each controller after all the controllers on an element have been constructed
        */
        $onInit() {
            // Initialize the UI
            this.refreshAddresses();
        }
        getPolyInfo(url, polyType) {
            const deferred = this.$q.defer();
            this.isLoading = true;
            this.$http.get(url).then((httpResponse) => {
                this.isLoading = false;
                const addresses = httpResponse.data;
                // Mark address as opposed to group bounds
                _.each(addresses, (a) => {
                    a.polyType = polyType;
                    if (polyType === "Group") {
                        a.oneLiner = `${a.shortName}, ${a.appName} (ID: ${a.groupId})`;
                        if (a.appName === "Condo")
                            a.visitUrl = `https://${a.shortName}.condoally.com/`;
                        else if (a.appName === "Hoa")
                            a.visitUrl = `https://${a.shortName}.hoaally.org/`;
                    }
                });
                $.merge(this.addresses, addresses);
                deferred.resolve(this.addresses);
            }, (httpResponse) => {
                this.isLoading = false;
                const errorMessage = httpResponse.data.exceptionMessage ? httpResponse.data.exceptionMessage : httpResponse.data;
                alert("Failed to retrieve addresses: " + errorMessage);
                deferred.reject();
            });
            return deferred.promise;
        }
        getGroupBoundPolys() {
            return this.getPolyInfo("/api/AdminMap/GetGroupBounds?filter=" + this.filterAddresses, "Group");
        }
        getAddressPolys() {
            return this.getPolyInfo("/api/AdminMap/GetAll?filter=" + this.filterAddresses, "Address");
        }
        // Get the addresses that are missing bounding polys
        refreshAddresses() {
            this.isLoading = true;
            this.addresses = [];
            const handleAddrs = (addresses) => {
                this.addressPoints = [];
                _.each(addresses, (a) => {
                    if (a.gpsPos) {
                        // The GoogleMapPoly directive uses the fullAddress for the marker tooltip
                        a.gpsPos.fullAddress = a.oneLiner;
                        this.addressPoints.push(a.gpsPos);
                    }
                });
            };
            if (this.includeAddresses)
                this.getAddressPolys().then(() => this.getGroupBoundPolys()).then(handleAddrs);
            else
                this.getGroupBoundPolys().then(handleAddrs);
        }
        onSavePoly() {
            this.isLoading = true;
            const serverVerts = { vertices: this.selectedAddress.gpsBounds.vertices };
            const url = this.selectedAddress.polyType === "Address" ? ("/api/AdminMap/UpdateAddress/" + this.selectedAddress.addressId) : ("/api/AdminMap/UpdateGroup/" + this.selectedAddress.groupId);
            this.$http.put(url, serverVerts).then(() => {
                this.isLoading = false;
            }, () => {
                this.isLoading = false;
            });
        }
        // Occurs when the user clicks an address link
        onAddressSelected(address) {
            //if ( address.gpsPos )
            //    this.mapInstance.setCenter( { lat: address.gpsPos.lat, lng: address.gpsPos.lon } );
            this.selectedAddress = address;
            // Ensure we have a valid array to work with
            if (!this.selectedAddress.gpsBounds)
                this.selectedAddress.gpsBounds = { vertices: [] };
            if (!this.selectedAddress.gpsBounds.vertices)
                this.selectedAddress.gpsBounds.vertices = [];
            // If the array is empty then create a default rectangle
            if (this.selectedAddress.gpsBounds.vertices.length == 0 && address.gpsPos) {
                //const southWest = new google.maps.LatLng( address.gpsPos.lat, address.gpsPos.lon );
                //const northEast = new google.maps.LatLng( address.gpsPos.lat + 0.001, address.gpsPos.lon + 0.001 );
                address.gpsBounds.vertices = [
                    { lat: address.gpsPos.lat, lon: address.gpsPos.lon },
                    { lat: address.gpsPos.lat + 0.001, lon: address.gpsPos.lon },
                    { lat: address.gpsPos.lat + 0.001, lon: address.gpsPos.lon + 0.001 },
                    { lat: address.gpsPos.lat, lon: address.gpsPos.lon + 0.001 }
                ];
            }
            this.selectedGpsPoly = address.gpsBounds;
            //createPolygon( this.mapInstance, address.gpsBounds.vertices );
        }
    }
    ManageAddressPolysController.$inject = ["$http", "$q"];
    Ally.ManageAddressPolysController = ManageAddressPolysController;
    class GroupBoundInfo {
    }
})(Ally || (Ally = {}));
CA.angularApp.component("manageAddressPolys", {
    templateUrl: "/ngApp/admin/manage-address-polys.html",
    controller: Ally.ManageAddressPolysController
});
