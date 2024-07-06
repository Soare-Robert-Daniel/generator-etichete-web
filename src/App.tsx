import {
  For,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  type Component,
} from "solid-js";
import { createStore } from "solid-js/store";

type Profile = {
  id: string;
  name: string;
  content: string;
};

type OptionsStore = {
  rows: number;
  cols: number;
  fontSize: string;
  profiles: Profile[];
};

const App: Component = () => {
  const [cellText, setCellText] = createSignal<string>("");
  const [currentProfileID, setCurrentProfileID] = createSignal<
    string | null | undefined
  >(null);

  const isEditing = () =>
    currentProfileID()?.length > 0 && currentProfileID() !== "new";

  const [options, setOptions] = createStore<OptionsStore>({
    rows: 10,
    cols: 4,
    fontSize: "8pt",
    profiles: [],
  });

  const saveProfile = () => {
    const profileName = window.prompt("Introduceti numele profilului:", "");
    if (profileName === null || profileName === "") {
      alert("NU ati introdus/salvat un nume valid pentru profil.");
      return;
    }

    const profile = {
      id: `${
        options.profiles.length + 1
      }-${Date.now()}-${Math.random().toString(36)}`,
      name: profileName,
      content: cellText(),
    };
    setOptions("profiles", (profiles) => [...profiles, profile]);

    setCurrentProfileID(profile.id);
  };

  const editCurrentProfile = () => {
    if (!isEditing()) {
      return;
    }

    const updatedProfiles = options.profiles.map((p) => {
      if (p.id === currentProfileID()) {
        return {
          ...p,
          content: cellText(),
        };
      }
      return p;
    });
    setOptions("profiles", updatedProfiles);
  };

  const deleteCurrentProfile = () => {
    if (!isEditing()) {
      return;
    }

    setOptions(
      "profiles",
      options.profiles.filter((profile) => profile.id !== currentProfileID()),
    );
    setCurrentProfileID(null);
  };

  const tableStructure = () => {
    const content = [];
    for (let i = 0; i < options.rows; i++) {
      const row = [];
      for (let j = 0; j < options.cols; j++) {
        row.push("");
      }
      content.push(row);
    }
    return content;
  };

  const preprocessContent = (content: string) => {
    const today = new Date();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paddedNumber = (n: number) => n.toString().padStart(2, "0");
    const formattedToday = `${paddedNumber(today.getDate())}.${paddedNumber(
      today.getMonth() + 1,
    )}.${today.getFullYear()}`;
    const formattedTomorrow = `${paddedNumber(
      tomorrow.getDate(),
    )}.${paddedNumber(tomorrow.getMonth() + 1)}.${tomorrow.getFullYear()}`;

    return content
      .replace("$astazi", formattedToday)
      .replace("$maine", formattedTomorrow);
  };

  const displayContent = createMemo(() => preprocessContent(cellText()));

  const downloadProfileAsJson = () => {
    const data = JSON.stringify(options.profiles);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    a.download = `profile-generator-etichete--${date.getFullYear()}_${month}_${day}.json`;

    a.click();
    a.remove();
  };

  const uploadProfiles = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        const profiles = JSON.parse(content);
        setOptions("profiles", profiles);
      } catch (e) {
        alert("Fisierul incarcat nu este un fisier JSON valid.");
      }
    };
    reader.readAsText(file);
  };

  const insertTag = (tag: string) => {
    setCellText((text) => `${text} ${tag}`);
  };

  onMount(() => {
    // Deserialize the options store from local storage.
    const rawStoredOptions = localStorage.getItem("options");

    if (!rawStoredOptions) {
      return;
    }

    const deserializedOptions = JSON.parse(rawStoredOptions);
    setOptions(deserializedOptions);

    setCurrentProfileID(options?.profiles?.[0]?.id);
    if (options.profiles.length > 0) {
      setCellText(options.profiles[0].content);
    }
  });

  createEffect(() => {
    // Serialize the options store to local storage.
    localStorage.setItem("options", JSON.stringify(options));
  });

  return (
    <div>
      <div class="panel">
        <div class="container">
          <div class="options">
            <label>
              <select
                value={isEditing() ? currentProfileID() : "new"}
                onChange={(e) => {
                  const profileId = e.target.value;
                  if (profileId === "new") {
                    setCurrentProfileID(null);
                    return;
                  }
                  const profile = options.profiles.find(
                    (profile) => profile.id === profileId,
                  );
                  if (profile) {
                    setCurrentProfileID(profile.id);
                    setCellText(profile.content);
                  }
                }}
              >
                <option value="new">Creaza profil</option>
                <For each={options.profiles}>
                  {(profile) => (
                    <option value={profile.id}>{profile.name}</option>
                  )}
                </For>
              </select>
            </label>
            <label>
              Randuri
              <input
                type="number"
                value={options.rows}
                onInput={(e) => {
                  setOptions("rows", parseInt(e.target.value));
                }}
              />
            </label>
            <label>
              Dimensiune font
              <input
                type="number"
                step="0.1"
                value={parseFloat(options.fontSize)}
                onInput={(e) => {
                  setOptions("fontSize", `${e.target.value}pt`);
                }}
              />
            </label>
            <label>
              Coloane
              <input
                type="number"
                value={options.cols}
                onInput={(e) => {
                  setOptions("cols", parseInt(e.target.value));
                }}
              />
            </label>
          </div>
          <div class="actions">
            <button
              classList={{
                hide: !isEditing(),
              }}
              onClick={deleteCurrentProfile}
            >
              <svg
                width="800px"
                height="800px"
                viewBox="0 0 1024 1024"
                class="icon"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M724.3 198H296.1l54.1-146.6h320z" fill="#FAFCFB" />
                <path
                  d="M724.3 216.5H296.1c-6.1 0-11.7-3-15.2-7.9-3.5-5-4.3-11.3-2.2-17L332.8 45c2.7-7.3 9.6-12.1 17.4-12.1h320c7.7 0 14.7 4.8 17.4 12.1l54.1 146.6c2.1 5.7 1.3 12-2.2 17-3.5 4.9-9.2 7.9-15.2 7.9z m-401.6-37h375.1L657.3 69.9H363.1l-40.4 109.6z"
                  fill="#0F0F0F"
                />
                <path
                  d="M664.3 981.6H339.7c-54.2 0-98.5-43.3-99.6-97.5L223.7 235h572.9l-32.8 651.4c-2.3 53.2-46.1 95.2-99.5 95.2z"
                  fill="#9DC6AF"
                />
                <path
                  d="M664.3 995H339.7c-29.7 0-57.8-11.4-79-32.2-21.2-20.8-33.3-48.6-34-78.3L210 221.6h600.7L777.2 887c-2.6 60.5-52.2 108-112.9 108zM237.4 248.3l16 635.5c0.5 22.7 9.7 44 25.9 59.8 16.2 15.9 37.7 24.6 60.4 24.6h324.6c46.3 0 84.2-36.2 86.2-82.5l32.1-637.4H237.4z"
                  fill="#191919"
                />
                <path
                  d="M827.1 239.5H193.3c-22.2 0-40.4-18.2-40.4-40.4v-2.2c0-22.2 18.2-40.4 40.4-40.4h633.8c22.2 0 40.4 18.2 40.4 40.4v2.2c0 22.2-18.2 40.4-40.4 40.4z"
                  fill="#D39E33"
                />
                <path
                  d="M826 252.9H194.4c-30.3 0-54.9-24.6-54.9-54.9 0-30.3 24.6-54.9 54.9-54.9H826c30.3 0 54.9 24.6 54.9 54.9s-24.7 54.9-54.9 54.9z m-631.6-83.1c-15.5 0-28.2 12.6-28.2 28.2s12.6 28.2 28.2 28.2H826c15.5 0 28.2-12.6 28.2-28.2 0-15.5-12.6-28.2-28.2-28.2H194.4z"
                  fill="#111111"
                />
                <path d="M354.6 430.3v369.6" fill="#FAFCFB" />
                <path
                  d="M354.6 813.3c-7.4 0-13.4-6-13.4-13.4V430.3c0-7.4 6-13.4 13.4-13.4s13.4 6 13.4 13.4v369.6c-0.1 7.4-6 13.4-13.4 13.4z"
                  fill="#0F0F0F"
                />
                <path d="M458.3 430.3v369.6" fill="#FAFCFB" />
                <path
                  d="M458.3 813.3c-7.4 0-13.4-6-13.4-13.4V430.3c0-7.4 6-13.4 13.4-13.4s13.4 6 13.4 13.4v369.6c0 7.4-6 13.4-13.4 13.4z"
                  fill="#0F0F0F"
                />
                <path d="M562.1 430.3v369.6" fill="#FAFCFB" />
                <path
                  d="M562.1 813.3c-7.4 0-13.4-6-13.4-13.4V430.3c0-7.4 6-13.4 13.4-13.4s13.4 6 13.4 13.4v369.6c-0.1 7.4-6.1 13.4-13.4 13.4z"
                  fill="#0F0F0F"
                />
                <path d="M665.8 430.3v369.6" fill="#FAFCFB" />
                <path
                  d="M665.8 813.3c-7.4 0-13.4-6-13.4-13.4V430.3c0-7.4 6-13.4 13.4-13.4s13.4 6 13.4 13.4v369.6c0 7.4-6 13.4-13.4 13.4z"
                  fill="#0F0F0F"
                />
              </svg>
              <span>Sterge profil</span>
            </button>
            <button
              classList={{
                hide: !isEditing(),
              }}
              onClick={editCurrentProfile}
            >
              <svg
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
              >
                <polygon
                  style="fill:#EFEFEF;"
                  points="355.192,15.763 355.192,496.237 13.767,496.237 13.767,125.9 124.014,15.763 "
                />
                <rect
                  x="280.2"
                  y="127.57"
                  transform="matrix(-0.7071 -0.7071 0.7071 -0.7071 373.0343 684.9955)"
                  style="fill:#61ACD2;"
                  width="96.369"
                  height="275.34"
                />
                <path
                  style="fill:#CA463D;"
                  d="M459.81,201.968l-68.143-68.143l24.338-24.338c18.817-18.817,49.326-18.817,68.143,0l0,0
	c18.817,18.817,18.817,49.326,0,68.143L459.81,201.968z"
                />
                <polygon
                  style="fill:#F4A026;"
                  points="264.789,397.679 172.307,422.015 196.644,329.534 "
                />
                <polygon
                  style="fill:#EFEFEF;"
                  points="123.904,15.763 123.904,125.9 13.877,125.9 "
                />
                <path
                  d="M493.882,100.441c-11.702-11.701-27.259-18.145-43.807-18.145c-16.548,0-32.161,6.444-43.862,18.145l-37.254,37.197V15.763
	c0-7.604-6.053-13.767-13.657-13.767H124.014c-3.651,0-7.153,1.451-9.735,4.032L4.087,116.166C1.506,118.747,0,122.249,0,125.9
	v370.336c0,7.604,6.274,13.767,13.877,13.767h341.425c7.604,0,13.657-6.164,13.657-13.767V312.868l124.867-124.813
	C505.528,176.353,512,160.796,512,144.248S505.583,112.143,493.882,100.441z M238.105,390.465l-46.478,12.231l12.231-46.477
	L238.105,390.465z M265.112,377.885l-48.674-48.674l175.227-175.227l48.674,48.674L265.112,377.885z M110.137,49v63.133H47.114
	L110.137,49z M341.425,482.47H27.534V139.668h96.48c7.604,0,13.657-6.164,13.657-13.767v-96.37h203.754v135.642L187.178,319.475
	c-0.067,0.067-0.096,0.14-0.161,0.209c-1.759,1.714-3.054,3.888-3.701,6.347l-24.329,92.481c-1.246,4.734,0.12,9.776,3.584,13.238
	c2.614,2.614,6.132,4.032,9.738,4.032c1.167,0,2.346-0.149,3.504-0.453l92.481-24.338c2.457-0.647,4.631-1.955,6.347-3.713
	c0.069-0.066,0.088-0.122,0.156-0.19l66.63-66.687V482.47z M474.412,168.584l-14.601,14.603l-48.674-48.674l14.601-14.601
	c6.501-6.501,15.144-10.082,24.338-10.082c9.192,0,17.837,3.581,24.338,10.082c6.501,6.501,10.08,15.144,10.08,24.336
	S480.912,162.085,474.412,168.584z"
                />
                <path
                  d="M117.131,408.127H77.206c-7.604,0-13.767,6.164-13.767,13.767s6.164,13.767,13.767,13.767h39.925
	c7.604,0,13.767-6.164,13.767-13.767S124.734,408.127,117.131,408.127z"
                />
                <path
                  d="M124.014,353.058H77.206c-7.604,0-13.767,6.164-13.767,13.767s6.164,13.767,13.767,13.767h46.808
	c7.604,0,13.767-6.164,13.767-13.767S131.618,353.058,124.014,353.058z"
                />
                <path
                  d="M137.782,297.99H77.206c-7.604,0-13.767,6.164-13.767,13.767c0,7.604,6.164,13.767,13.767,13.767h60.575
	c7.604,0,13.767-6.164,13.767-13.767C151.549,304.153,145.385,297.99,137.782,297.99z"
                />
                <path
                  d="M77.206,270.456h100.5c7.604,0,13.767-6.164,13.767-13.767c0-7.604-6.164-13.767-13.767-13.767h-100.5
	c-7.604,0-13.767,6.164-13.767,13.767C63.439,264.292,69.603,270.456,77.206,270.456z"
                />
                <path
                  d="M77.206,215.387h156.945c7.604,0,13.767-6.164,13.767-13.767s-6.164-13.767-13.767-13.767H77.206
	c-7.604,0-13.767,6.164-13.767,13.767S69.603,215.387,77.206,215.387z"
                />
                <path
                  d="M179.083,160.318H297.48c7.604,0,13.767-6.164,13.767-13.767c0-7.604-6.164-13.767-13.767-13.767H179.083
	c-7.604,0-13.767,6.164-13.767,13.767C165.316,154.155,171.479,160.318,179.083,160.318z"
                />
                <path
                  d="M179.083,105.25H297.48c7.604,0,13.767-6.164,13.767-13.767c0-7.604-6.164-13.767-13.767-13.767H179.083
	c-7.604,0-13.767,6.164-13.767,13.767C165.316,99.086,171.479,105.25,179.083,105.25z"
                />
              </svg>
              <span>Modifica profil</span>
            </button>
            <button
              classList={{ hide: isEditing() }}
              onClick={() => saveProfile()}
            >
              <svg
                width="800px"
                height="800px"
                viewBox="0 0 1024 1024"
                class="icon"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M960 252.736L771.008 64H86.4a22.528 22.528 0 0 0-22.4 22.4v851.2c0 12.352 10.112 22.4 22.4 22.4h851.2c12.288 0 22.4-10.048 22.4-22.4v-215.36a22.4 22.4 0 0 0-44.864 0V596.032h0.256c0 0.512-0.256 0.896-0.256 1.344a22.4 22.4 0 1 0 44.864 0c0-0.512-0.256-0.896-0.256-1.344H960v-96h-0.32c0.064-0.576 0.32-1.088 0.32-1.6a22.4 22.4 0 0 0-44.864 0c0 0.576 0.256 1.024 0.32 1.6H915.2V414.976h0.064l-0.064 0.384a22.4 22.4 0 0 0 44.8 0.064l-0.064-0.384H960V252.736z"
                  fill=""
                />
                <path
                  d="M108.8 915.2V108.8h643.648L915.2 271.296V915.2z"
                  fill="#4A5FA0"
                />
                <path
                  d="M241.984 64v203.584c0 12.288 10.112 22.4 22.4 22.4h483.2c12.288 0 22.4-10.112 22.4-22.4V64h-528z"
                  fill=""
                />
                <path d="M286.784 108.8h438.4v136.384h-438.4z" fill="#B3B2B1" />
                <path
                  d="M769.984 960V548.352a22.592 22.592 0 0 0-22.464-22.4H264.32a22.528 22.528 0 0 0-22.4 22.4V960h528.064z"
                  fill=""
                />
                <path d="M286.784 570.816h438.4V915.2h-438.4z" fill="#B3B2B1" />
                <path d="M548.032 136h145.984v81.984H548.032z" fill="#949494" />
                <path
                  d="M670.976 653.248c0 12.288-10.048 22.4-22.4 22.4h-275.2c-12.288 0-22.4-10.048-22.4-22.4s10.112-22.4 22.4-22.4h275.2c12.352 0 22.4 10.112 22.4 22.4zM670.976 744.64c0 12.288-10.048 22.4-22.4 22.4h-275.2c-12.288 0-22.4-10.048-22.4-22.4s10.112-22.4 22.4-22.4h275.2a22.4 22.4 0 0 1 22.4 22.4zM670.976 836.032c0 12.288-10.048 22.4-22.4 22.4h-275.2c-12.288 0-22.4-10.048-22.4-22.4s10.112-22.4 22.4-22.4h275.2a22.4 22.4 0 0 1 22.4 22.4z"
                  fill=""
                />
                <path
                  d="M168.576 858.368a16 16 0 0 1-32 0V169.024a16 16 0 0 1 32 0v689.344z"
                  fill="#FFFFFF"
                />
              </svg>
              <span>Salveaza profil</span>
            </button>
            <button onClick={() => print()}>
              <svg
                width="800px"
                height="800px"
                viewBox="0 0 1024 1024"
                class="icon"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M192 234.666667h640v64H192z" fill="#424242" />
                <path
                  d="M85.333333 533.333333h853.333334v-149.333333c0-46.933333-38.4-85.333333-85.333334-85.333333H170.666667c-46.933333 0-85.333333 38.4-85.333334 85.333333v149.333333z"
                  fill="#616161"
                />
                <path
                  d="M170.666667 768h682.666666c46.933333 0 85.333333-38.4 85.333334-85.333333v-170.666667H85.333333v170.666667c0 46.933333 38.4 85.333333 85.333334 85.333333z"
                  fill="#424242"
                />
                <path
                  d="M853.333333 384m-21.333333 0a21.333333 21.333333 0 1 0 42.666667 0 21.333333 21.333333 0 1 0-42.666667 0Z"
                  fill="#00E676"
                />
                <path
                  d="M234.666667 85.333333h554.666666v213.333334H234.666667z"
                  fill="#90CAF9"
                />
                <path
                  d="M800 661.333333h-576c-17.066667 0-32-14.933333-32-32s14.933333-32 32-32h576c17.066667 0 32 14.933333 32 32s-14.933333 32-32 32z"
                  fill="#242424"
                />
                <path
                  d="M234.666667 661.333333h554.666666v234.666667H234.666667z"
                  fill="#90CAF9"
                />
                <path
                  d="M234.666667 618.666667h554.666666v42.666666H234.666667z"
                  fill="#42A5F5"
                />
                <path
                  d="M341.333333 704h362.666667v42.666667H341.333333zM341.333333 789.333333h277.333334v42.666667H341.333333z"
                  fill="#1976D2"
                />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>
        <textarea
          cols={50}
          rows={10}
          onInput={(e) => {
            setCellText(e.target.value);
          }}
          placeholder="Introduce continutul etichetei aici..."
        >
          {cellText()}
        </textarea>
        <div class="container">
          <button
            onClick={() => insertTag("$astazi")}
            classList={{
              default: true,
              "tag-present": cellText().includes("$astazi"),
            }}
          >
            Data de astazi
          </button>
          <button
            class="default"
            classList={{
              default: true,
              "tag-present": cellText().includes("$maine"),
            }}
            onClick={() => insertTag("$maine")}
          >
            Data de maine
          </button>
        </div>
      </div>
      <table style={{ "--cell-font-size": options.fontSize }}>
        <tbody>
          <For each={tableStructure()}>
            {(row) => (
              <tr>
                <For each={row}>
                  {() => (
                    <td>
                      <span class="cell">{displayContent()}</span>
                    </td>
                  )}
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      <div class="download-area">
        <button class="btn-filled" onClick={downloadProfileAsJson}>
          Descarca Profil
        </button>
        <div class="file-upload-area">
          <input type="file" />
          <button
            class="btn-filled"
            onClick={() => {
              const fileInput = document.querySelector(
                "input[type=file]",
              ) as HTMLInputElement;
              if (fileInput.files && fileInput.files.length > 0) {
                uploadProfiles(fileInput.files[0]);
              } else {
                alert("Va rugam sa selectati un fisier pentru incarcare.");
              }
            }}
          >
            Incarca Profil
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
