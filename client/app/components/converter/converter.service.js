angular
    .module("services")
    .service("ConverterService", class ConverterService {

        constructor (translator) {
            this.translator = translator;

            this.base = 1000;

            this.def = [
                {
                    val: 1,
                    unit: "B"
                }, {
                    val: this.base,
                    unit: "KB"
                }, {
                    val: this.base * this.base,
                    unit: "MB"
                }, {
                    val: this.base * this.base * this.base,
                    unit: "GB"
                }, {
                    val: this.base * this.base * this.base * this.base,
                    unit: "TB"
                }, {
                    val: this.base * this.base * this.base * this.base * this.base,
                    unit: "PB"
                }, {
                    val: this.base * this.base * this.base * this.base * this.base * this.base,
                    unit: "EB"
                }, {
                    val: this.base * this.base * this.base * this.base * this.base * this.base * this.base,
                    unit: "ZB"
                }, {
                    val: this.base * this.base * this.base * this.base * this.base * this.base * this.base * this.base,
                    unit: "YB"
                }];
        }

        /**
         * Convert a number into octet
         * @param  {number} nb   Number to convert
         * @param  {string} unit Unit of the number
         * @return {number}      the number converted
         */
        convertToOctet (nb, unit) {
            if (!_.isNumber(Number(nb)) || !_.isString(unit)) {
                throw new Error("Wrong parameter(s)");
            }

            const baseUnit = _.findIndex(this.def, { unit });

            if (baseUnit < 0) {
                throw new Error("Wrong unit given");
            }

            return this.def[baseUnit].val * nb;
        }

        /**
         * Convert a number to its best unit
         * @param  {number} nb                Number to convert
         * @param  {string} unit              Unit of the number to convert
         * @param  {number} [decimalWanted=0] Number of decimal wanted
         * @return {string}                   A string formatted as "<value> <unit>"
         */
        convertBytesSize (nb, unit, decimalWanted = 0) {
            const res = filesize(this.convertToOctet(nb, unit), { output: "object", round: decimalWanted, base: -1 });
            const resUnit = this.translator.tr(`unit_size_${res.symbol}`);

            return `${res.value} ${resUnit}`;
        }
});
