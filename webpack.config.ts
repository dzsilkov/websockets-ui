import path from "path";

module.exports = {
    entry: "./src/index",
    target: "node",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "index.js",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    plugins: [],
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.ts$/i,
                use: "ts-loader",
            },
        ],
    },
};