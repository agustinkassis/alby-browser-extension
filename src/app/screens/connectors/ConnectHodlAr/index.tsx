import ConnectorForm from "@components/ConnectorForm";
import TextField from "@components/form/TextField";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import msg from "~/common/lib/msg";

// const walletCreateUrl =
//   process.env.HODL_CREATE_URL || "https://hodl.ar/api/users/create";

const walletCreateUrl = "http://localhost:3000/api/users/create";

interface HODLCreateResponse {
  username: string;
  handle: string;
  lnAddress: string;
  lnbitUser: string;
  endpoint: string;
  walletUrl: string;
  lndhub: {
    login: string;
    password: string;
    url: string;
  };
}

const initialFormData = {
  githubUsername: "",
};

export default function HODLWallet() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation("translation", {
    keyPrefix: "choose_connector.hodlar",
  });
  const { t: tCommon } = useTranslation("common");
  const [formData, setFormData] = useState(initialFormData);

  function signup(event: React.FormEvent<HTMLFormElement>) {
    setLoading(true);
    event.preventDefault();

    const headers = new Headers();
    headers.append("Accept", "application/json");
    headers.append("Access-Control-Allow-Origin", "*");
    headers.append("Content-Type", "application/json");
    headers.append("X-User-Agent", "alby-extension");

    const body = JSON.stringify({
      github: formData.githubUsername,
    });

    return fetch(walletCreateUrl, {
      method: "POST",
      headers,
      body,
    })
      .then((res) => res.json())
      .then((data) => {
        console.info("DATA returned:");
        console.dir(data);

        const { success, message, data: content } = data;
        if (success) {
          setLoading(false);
          next({
            ...content,
          });
        } else {
          setLoading(false);
          toast.error(
            <p>
              {t("errors.create_wallet_error1")}
              <br />
              {t("errors.create_wallet_error2")}
              <br />
              <p>
                <span>{message}</span>
              </p>
            </p>
          );
        }
      })
      .catch((e) => {
        console.error(e);
        toast.error(`${t("errors.create_wallet_error")} - ${e.message}`);
        setLoading(false);
      });
  }

  async function next(user: HODLCreateResponse) {
    setLoading(true);

    const { login, password, url } = user.lndhub;
    const name = user.handle;
    const account = {
      name,
      config: {
        login,
        password,
        url,
        lnAddress: user.lnAddress,
      },
      connector: "lndhub",
    };

    console.info("***** Account *****");
    console.dir(account);

    try {
      const validation = await msg.request("validateAccount", account);
      if (validation.valid) {
        const addResult = await msg.request("addAccount", account);
        if (addResult.accountId) {
          await msg.request("selectAccount", {
            id: addResult.accountId,
          });
          navigate("/test-connection");
        }
      } else {
        console.error({ validation });
        toast.error(
          `${tCommon("errors.connection_failed")} (${validation.error})`
        );
      }
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        toast.error(`${tCommon("errors.connection_failed")} (${e.message})`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConnectorForm
      title={t("page.title")}
      description={
        <Trans
          i18nKey={"page.instructions"}
          t={t}
          // eslint-disable-next-line react/jsx-key
          components={[<strong></strong>, <br />]}
        />
      }
      submitLoading={loading}
      onSubmit={signup}
      submitDisabled={loading || formData.githubUsername === ""}
    >
      <div className="mt-6">
        <TextField
          id="githubUsername"
          label={t("github.label")}
          type="text"
          pattern="[a-zA-Z0-9-]{3,39}"
          minLength={3}
          maxLength={39}
          title={t("github.label")}
          disabled={loading}
          onChange={(e) => {
            const githubUsername = e.target.value.trim();
            setFormData({ ...formData, githubUsername });
          }}
        />
        <p className="mb-2 text-gray-700 dark:text-neutral-400">
          {formData.githubUsername === "" ? (
            ""
          ) : (
            <>
              <a
                href={`https://github.com/${formData.githubUsername}/.hodl.ar`}
                target="_blank"
                rel="noreferrer"
              >
                https://github.com/<b>{formData.githubUsername}</b>/.hodl.ar
              </a>
            </>
          )}
        </p>
      </div>
      <div className="mt-6">
        {/* <div>
            <TextField
              id="username"
              label="Tu nombre de usuario único en HODL.ar"
              suffix="@hodl.ar"
              type="text"
              pattern="[a-zA-Z0-9-]{4,}"
              title="Tu nombre de usuario"
              onChange={(e) => {
                const username = e.target.value.trim().split("@")[0]; // in case somebody enters a full address we simple remove the domain
                setFormData({ ...formData, username });
              }}
            />
          </div> */}
      </div>
    </ConnectorForm>
  );
}
