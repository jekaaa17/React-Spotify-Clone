import React, { useState, useEffect } from "react";
import useAuth from "./useAuth";
import { Container } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node";
import TrackSearchResult from "./TrackSearchResult";
import Player from "./Player";
import axios from "axios";
import "./css/Dashboard.css";

const spotifyApi = new SpotifyWebApi({
  clientId: "f33d002eac3a48c39918706f7a240fca",
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();
  const [lyrics, setLyrics] = useState("");

  const chooseTrack = (track) => {
    setPlayingTrack(track);
    setSearch("");
    setLyrics("");
  };

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;

    let cancel = false;
    spotifyApi.searchTracks(search).then((res) => {
      if (cancel) return;
      setSearchResults(
        res.body.tracks.items.map((track) => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest, image) => {
              if (image.height < smallest.height) return image;
              return smallest;
            },
            track.album.images[0]
          );

          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
          };
        })
      );
    });
    return () => (cancel = true);
  }, [search, accessToken]);

  useEffect(() => {
    if (!playingTrack) return;

    axios
      .get(" https://react-spotify-express.herokuapp.com/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then((res) => {
        setLyrics(res.data.lyrics);
      });
  }, [playingTrack]);

  return (
    <div className="background">
      <Container
        className="d-flex flex-column py-4 dashboard"
        style={{ height: "95vh" }}
      >
        <div className="searchContainer">
          <i className="fa fa-search searchIcon"></i>
          <input
            className="searchBox"
            type="search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Songs/Artists/Albums"
          />
        </div>
        <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
          {searchResults.map((track) => (
            <TrackSearchResult
              track={track}
              key={track.uri}
              chooseTrack={chooseTrack}
            />
          ))}
          {searchResults.length === 0 && (
            <div
              className="text-center lyrics-font"
              style={{ whiteSpace: "pre" }}
            >
              {lyrics}
            </div>
          )}
        </div>
        <div>
          <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
        </div>
      </Container>
    </div>
  );
}
