{
  pkgs ? import <nixpkgs> { },
}:

pkgs.mkShell {
  buildInputs = [ pkgs.nodejs_20 ];
  shellHook = "echo \"Use \"npm run frontend:develop:prod\" to start the development server\"";
}
